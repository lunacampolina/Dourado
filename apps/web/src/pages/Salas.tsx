import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Sala } from "@salas/tipos";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Search, Trash2 } from "lucide-react";

export function Salas() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [capacidade, setCapacidade] = useState("6");

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function carregar(termo = busca) {
    try {
      const lista = await api.listarSalas(termo);
      setSalas(lista);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar salas.");
    }
  }

  useEffect(() => {
    carregar(busca);
  }, [busca]);

  function iniciarEdicao(sala: Sala) {
    setEditandoId(sala.id);
    setNome(sala.nome);
    setCapacidade(String(sala.capacidade));
    setErro(null);
    setSucesso(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setNome("");
    setCapacidade("6");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    try {
      const payload = { nome, capacidade: Number(capacidade) };
      if (editandoId !== null) {
        await api.atualizarSala(editandoId, payload);
        setSucesso("Sala atualizada com sucesso!");
        cancelarEdicao();
      } else {
        await api.criarSala(payload);
        setSucesso("Sala cadastrada com sucesso!");
        setNome("");
        setCapacidade("6");
      }
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar sala.");
    }
  }

  async function handleExcluir(id: number, nomeSala: string) {
    setErro(null);
    setSucesso(null);
    const confirmado = window.confirm(
      `Excluir "${nomeSala}"? Todas as reservas desta sala também serão apagadas. Esta ação não pode ser desfeita.`
    );
    if (!confirmado) return;
    try {
      await api.excluirSala(id);
      setSucesso(`"${nomeSala}" removida com sucesso.`);
      if (editandoId === id) cancelarEdicao();
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao excluir sala.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <span className="page-kicker">INFRAESTRUTURA / ESPAÇOS</span>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Salas de Estudo
        </h1>
        <p className="text-sm text-neutral-500">
          Gerencie as salas disponíveis e a capacidade de cada espaço.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {editandoId !== null ? "Editar sala" : "Cadastrar nova sala"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-end gap-4"
          >
            <div className="min-w-56 flex-1 space-y-1.5">
              <Label htmlFor="nome-sala">Nome da sala</Label>
              <Input
                id="nome-sala"
                placeholder="Ex.: Sala 4"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="w-36 space-y-1.5">
              <Label htmlFor="capacidade-sala">Capacidade</Label>
              <Input
                id="capacidade-sala"
                type="number"
                min={1}
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editandoId !== null ? "Salvar alterações" : "Adicionar sala"}
              </Button>
              {editandoId !== null && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelarEdicao}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>

          {erro && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {sucesso}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">
            Salas cadastradas ({salas.length})
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar sala..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>

        <CardContent>
          {salas.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              Nenhuma sala encontrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salas.map((sala) => (
                  <TableRow key={sala.id}>
                    <TableCell className="text-neutral-500">
                      #{sala.id}
                    </TableCell>
                    <TableCell className="font-medium">{sala.nome}</TableCell>
                    <TableCell>{sala.capacidade} pessoas</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => iniciarEdicao(sala)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleExcluir(sala.id, sala.nome)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}