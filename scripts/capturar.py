"""Captura a interface real. Execute somente em uma cópia de demonstração sem reservas."""
from datetime import date
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://localhost:5173'
OUT = ROOT / 'docs' / 'evidencias-novas'
DAY = date.today().isoformat()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1, locale='pt-BR')
    page.goto(BASE)
    rooms_response = page.request.get(BASE + '/api/salas')
    assert rooms_response.ok, 'API indisponível'
    rooms = {r['nome']: str(r['id']) for r in rooms_response.json()}
    assert 'Sala 1' in rooms and 'Sala 2' in rooms, 'Salas iniciais não encontradas'
    assert page.request.get(BASE + '/api/reservas').json() == [], 'Use uma cópia nova, sem reservas. Nenhum dado foi apagado.'
    OUT.mkdir(exist_ok=True)
    records = []
    def snap(name, description):
        page.evaluate('document.fonts.ready')
        page.mouse.move(1, 1)
        page.screenshot(path=str(OUT / (name + '.png')), full_page=True, animations='disabled')
        records.append((name, description))
    def nav(name):
        page.get_by_role('navigation').get_by_role('button', name=name, exact=True).click()
    def reserve(room, person, conflict=False):
        page.locator('#sala').select_option(rooms[room])
        page.locator('#responsavel').fill(person)
        page.locator('#data').fill(DAY)
        page.locator('#hora').select_option('14')
        with page.expect_response(lambda r: r.url.endswith('/api/reservas') and r.request.method == 'POST') as resp:
            page.get_by_role('button', name='Reservar sala').click()
        assert resp.value.status == (409 if conflict else 201)
        if conflict:
            expect(page.get_by_role('alert')).to_contain_text('já está reservada')
        else:
            expect(page.get_by_role('status')).to_contain_text('cadastrada com sucesso')
            expect(page.get_by_role('row').filter(has_text=person)).to_be_visible()
        expect(page.get_by_role('button', name='Reservar sala')).to_be_enabled()
    nav('Agenda')
    expect(page.locator('#sala option')).to_have_count(len(rooms))
    page.locator('#data').fill(DAY)
    page.locator('#filtro-data').fill(DAY)
    snap('00-agenda-inicial', 'Agenda antes das reservas.')
    reserve('Sala 1', 'Ana Silva')
    snap('01-reserva-sala-1', 'T01: reserva da Sala 1 aceita (HTTP 201).')
    reserve('Sala 1', 'Bruno Lima', True)
    snap('02-conflito', 'T02: duplicidade bloqueada (HTTP 409).')
    reserve('Sala 2', 'Bruno Lima')
    snap('03-reserva-sala-2', 'T03: Sala 2 aceita no mesmo horário (HTTP 201).')
    row = page.get_by_role('row').filter(has_text='Ana Silva')
    with page.expect_response(lambda r: r.url.endswith('/cancelar') and r.request.method == 'PATCH') as resp:
        row.get_by_role('button', name='Cancelar').click()
    assert resp.value.status == 200
    expect(row).to_contain_text('Cancelada')
    snap('04-cancelamento', 'T05: cancelamento confirmado (HTTP 200).')
    reserve('Sala 1', 'Carla Souza')
    snap('05-nova-reserva', 'T06: horário reutilizado (HTTP 201).')
    expect(page.get_by_role('row')).to_have_count(4)
    snap('06-agenda-todos', 'T07: histórico com duas ativas e uma cancelada.')
    page.locator('#filtro-status').select_option('ativa')
    expect(page.get_by_role('row')).to_have_count(3)
    expect(page.get_by_role('row').filter(has_text='Ana Silva')).to_have_count(0)
    snap('07-filtro-ativas', 'Filtro de reservas ativas.')
    page.locator('#filtro-status').select_option('cancelada')
    expect(page.get_by_role('row')).to_have_count(2)
    expect(page.get_by_role('row').filter(has_text='Ana Silva')).to_be_visible()
    snap('08-filtro-canceladas', 'T14: somente reserva cancelada.')
    page.locator('#filtro-status').select_option('todos')
    page.locator('#filtro-sala').select_option(rooms['Sala 1'])
    expect(page.get_by_role('row').filter(has_text='Carla Souza')).to_be_visible()
    expect(page.get_by_role('row').filter(has_text='Bruno Lima')).to_have_count(0)
    expect(page.get_by_role('row')).to_have_count(3)
    snap('09-filtro-sala-data', 'T04: somente Sala 1 na data selecionada.')
    nav('Visão geral')
    expect(page.get_by_text('Salas cadastradas', exact=True)).to_be_visible()
    snap('dashboard', 'Indicadores com os dados reais do roteiro.')
    nav('Salas')
    expect(page.get_by_role('row').filter(has_text='Sala 1')).to_be_visible()
    snap('salas', 'Cadastro e gerenciamento das salas.')
    nav('Relatórios')
    expect(page.get_by_role('row').filter(has_text='Carla Souza')).to_be_visible()
    snap('relatorios', 'Relatório e histórico real do roteiro.')
    try:
        page.goto(BASE + '/docs', wait_until='domcontentloaded')
        expect(page.get_by_text('API — Reserva de Salas de Estudo', exact=True).first).to_be_visible(timeout=25000)
        snap('api-scalar', 'Referência interativa da API.')
    except Exception as exc:
        print('Scalar não capturado (depende do CDN):', exc)
    browser.close()
    report = ['# Evidências da interface redesenhada', '', f'Execução local em {DAY}. Capturas reais do Chromium, sem barra do navegador. Nomes fictícios.', '']
    for name, desc in records:
        report += [f'## {desc}', '', f'![{desc}](evidencias-novas/{name}.png)', '']
    (ROOT / 'docs' / 'evidencias-atualizadas.md').write_text('\n'.join(report), encoding='utf-8')
    print(f'{len(records)} capturas gravadas em {OUT}')
