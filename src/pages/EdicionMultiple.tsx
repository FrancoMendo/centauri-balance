import { useState, useEffect } from "react";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Search, 
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { getDb } from "../lib/db";
import { productos as productosTable, grupos_productos as gruposTable } from "../lib/schema";
import { eq, inArray, sql, like, or } from "drizzle-orm";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PriceDisplay } from "../components/ui/PriceDisplay";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { toast } from "sonner";

interface Grupo {
  id_grupo: number;
  nombre: string;
  ids_productos: number[];
}

interface Producto {
  id_producto: number;
  nombre: string;
  precio_venta: number;
  codigo_barras: string | null;
}

export function EdicionMultiple() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para nuevo grupo
  const [newGroupName, setNewGroupName] = useState("");
  
  // Buscador de productos
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  
  // Productos actuales del grupo seleccionado
  const [groupProducts, setGroupProducts] = useState<Producto[]>([]);
  
  // Acción masiva
  const [percentage, setPercentage] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Configuración del Modal de Confirmación
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "primary" | "danger" | "warning";
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "primary",
  });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    fetchGrupos();
  }, []);

  useEffect(() => {
    if (selectedGrupo) {
      fetchGroupProducts(selectedGrupo.ids_productos);
    } else {
      setGroupProducts([]);
    }
  }, [selectedGrupo]);

  const fetchGrupos = async () => {
    setIsLoading(true);
    try {
      const db = await getDb();
      const res = await db.select().from(gruposTable);
      const parsed = res.map((g: any) => ({
        ...g,
        ids_productos: JSON.parse(g.ids_productos || "[]")
      }));
      setGrupos(parsed);
    } catch (error) {
      console.error("Error fetching grupos:", error);
      toast.error("Error al cargar grupos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupProducts = async (ids: number[]) => {
    if (ids.length === 0) {
      setGroupProducts([]);
      return;
    }
    try {
      const db = await getDb();
      const res = await db
        .select({
          id_producto: productosTable.id_producto,
          nombre: productosTable.nombre,
          precio_venta: productosTable.precio_venta,
          codigo_barras: productosTable.codigo_barras
        })
        .from(productosTable)
        .where(inArray(productosTable.id_producto, ids));
      setGroupProducts(res);
    } catch (error) {
      console.error("Error fetching group products:", error);
    }
  };

  const createGrupo = async () => {
    if (!newGroupName.trim()) return;
    try {
      const db = await getDb();
      await db.insert(gruposTable).values({
        nombre: newGroupName,
        ids_productos: JSON.stringify([])
      });
      setNewGroupName("");
      fetchGrupos();
      toast.success("Grupo creado");
    } catch (error) {
      toast.error("Error al crear grupo");
    }
  };

  const deleteGrupo = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Grupo",
      description: "¿Estás seguro de que deseas eliminar este grupo de edición? Esta acción no se puede deshacer.",
      variant: "danger",
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        try {
          const db = await getDb();
          await db.delete(gruposTable).where(eq(gruposTable.id_grupo, id));
          if (selectedGrupo?.id_grupo === id) setSelectedGrupo(null);
          fetchGrupos();
          toast.success("Grupo eliminado");
        } catch (error) {
          toast.error("Error al eliminar grupo");
        }
      }
    });
  };

  const searchProducts = async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const db = await getDb();
      const res = await db
        .select({
          id_producto: productosTable.id_producto,
          nombre: productosTable.nombre,
          precio_venta: productosTable.precio_venta,
          codigo_barras: productosTable.codigo_barras
        })
        .from(productosTable)
        .where(
          or(
            like(productosTable.nombre, `%${q}%`),
            like(productosTable.codigo_barras, `%${q}%`)
          )
        )
        .limit(10);
      setSearchResults(res);
    } catch (error) {
      console.error(error);
    }
  };

  const addProductToGroup = async (product: Producto) => {
    if (!selectedGrupo) return;
    if (selectedGrupo.ids_productos.includes(product.id_producto)) {
      toast.error("El producto ya está en el grupo");
      return;
    }

    const newIds = [...selectedGrupo.ids_productos, product.id_producto];
    try {
      const db = await getDb();
      await db.update(gruposTable)
        .set({ ids_productos: JSON.stringify(newIds) })
        .where(eq(gruposTable.id_grupo, selectedGrupo.id_grupo));
      
      const updatedGrupo = { ...selectedGrupo, ids_productos: newIds };
      setSelectedGrupo(updatedGrupo);
      setGrupos(grupos.map(g => g.id_grupo === updatedGrupo.id_grupo ? updatedGrupo : g));
      setSearchQuery("");
      setSearchResults([]);
      toast.success("Producto añadido");
    } catch (error) {
      toast.error("Error al añadir producto");
    }
  };

  const removeProductFromGroup = async (productId: number) => {
    if (!selectedGrupo) return;
    const newIds = selectedGrupo.ids_productos.filter(id => id !== productId);
    try {
      const db = await getDb();
      await db.update(gruposTable)
        .set({ ids_productos: JSON.stringify(newIds) })
        .where(eq(gruposTable.id_grupo, selectedGrupo.id_grupo));
      
      const updatedGrupo = { ...selectedGrupo, ids_productos: newIds };
      setSelectedGrupo(updatedGrupo);
      setGrupos(grupos.map(g => g.id_grupo === updatedGrupo.id_grupo ? updatedGrupo : g));
      toast.success("Producto quitado");
    } catch (error) {
      toast.error("Error al quitar producto");
    }
  };

  const applyBulkIncrease = async () => {
    if (!selectedGrupo || percentage <= 0 || groupProducts.length === 0) return;

    setConfirmConfig({
      isOpen: true,
      title: "Aplicar aumento masivo",
      description: `¿Estás seguro de que deseas aplicar un aumento del ${percentage}% a los ${groupProducts.length} productos de este grupo?`,
      variant: "warning",
      confirmLabel: "Aplicar aumento",
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          const db = await getDb();
          const factor = 1 + (percentage / 100);
          
          await db.update(productosTable)
            .set({
              precio_venta: sql`${productosTable.precio_venta} * ${factor}`
            })
            .where(inArray(productosTable.id_producto, selectedGrupo.ids_productos));

          toast.success(`Aumento aplicado correctamente`);
          setPercentage(0);
          fetchGroupProducts(selectedGrupo.ids_productos);
        } catch (error) {
          console.error(error);
          toast.error("Error al aplicar aumento masivo");
        } finally {
          setIsUpdating(false);
        }
      }
    });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] animate-in fade-in duration-500">
      {/* Sidebar de Grupos */}
      <div className="w-80 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Layers className="w-4 h-4" /> Grupos de Edición
          </h2>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input 
              placeholder="Nuevo grupo..." 
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="py-2"
              onKeyDown={e => e.key === 'Enter' && createGrupo()}
            />
            <Button size="sm" onClick={createGrupo} className="shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm italic">Cargando...</div>
          ) : grupos.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No hay grupos creados</p>
            </div>
          ) : (
            grupos.map(g => (
              <div 
                key={g.id_grupo}
                onClick={() => setSelectedGrupo(g)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedGrupo?.id_grupo === g.id_grupo 
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100" 
                  : "hover:bg-gray-50 text-gray-600"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${selectedGrupo?.id_grupo === g.id_grupo ? "bg-blue-500" : "bg-gray-200"}`} />
                  <span className="font-medium truncate text-sm">{g.nombre}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] bg-gray-200/50 text-gray-500 px-1.5 py-0.5 rounded-md font-mono">
                    {g.ids_productos.length}
                   </span>
                   <button 
                    onClick={(e) => { e.stopPropagation(); deleteGrupo(g.id_grupo); }}
                    className="p-1 hover:text-red-500 transition-colors"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {selectedGrupo ? (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    {selectedGrupo.nombre}
                    <span className="text-sm font-normal text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      {groupProducts.length} productos asignados
                    </span>
                  </h1>
                </div>
                
                <div className="flex items-center gap-4 bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Aumento Porcentual</span>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          placeholder="%"
                          value={percentage || ''}
                          onChange={e => setPercentage(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right font-bold text-blue-600 bg-white"
                        />
                        <span className="font-bold text-blue-600">%</span>
                      </div>
                   </div>
                   <Button 
                    variant="primary" 
                    className="h-[46px] px-6 shadow-md shadow-blue-200"
                    disabled={percentage <= 0 || groupProducts.length === 0 || isUpdating}
                    onClick={applyBulkIncrease}
                   >
                     {isUpdating ? "Aplicando..." : (
                       <span className="flex items-center gap-2">
                         <TrendingUp className="w-5 h-5" /> Aplicar
                       </span>
                     )}
                   </Button>
                </div>
              </div>

              {/* Buscador de productos para añadir */}
              <div className="relative">
                <Input 
                  placeholder="Buscar productos por nombre o código para añadir al grupo..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  icon={<Search className="w-5 h-5 text-gray-400" />}
                  className="bg-gray-50 border-none shadow-inner focus:bg-white"
                />
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {searchResults.map(p => (
                      <div 
                        key={p.id_producto}
                        onClick={() => addProductToGroup(p)}
                        className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 group"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{p.nombre}</span>
                          <span className="text-xs text-gray-400 font-mono">{p.codigo_barras || "S/N"}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <PriceDisplay amount={p.precio_venta} className="font-bold text-gray-700" />
                          <div className="p-1 px-3 bg-blue-100 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">
                            Añadir
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Listado de productos en el grupo */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
                    <tr>
                      <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Producto</th>
                      <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Código</th>
                      <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px] text-right">Precio Actual</th>
                      <th className="py-4 px-6 font-bold text-gray-400 uppercase tracking-widest text-[10px] text-center w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-gray-400">
                           No hay productos en este grupo. Búscalos arriba para añadirlos.
                        </td>
                      </tr>
                    ) : (
                      groupProducts.map(p => (
                        <tr key={p.id_producto} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="py-4 px-6">
                            <span className="font-semibold text-gray-800">{p.nombre}</span>
                          </td>
                          <td className="py-4 px-6 font-mono text-xs text-gray-400">
                            {p.codigo_barras || "-"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <PriceDisplay amount={p.precio_venta} className="font-bold text-gray-900" />
                          </td>
                          <td className="py-4 px-6 text-center">
                             <button 
                              onClick={() => removeProductFromGroup(p.id_producto)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 border-dashed flex flex-col items-center justify-center p-20 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Layers className="w-10 h-10 text-blue-200" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Seleccione o cree un grupo</h2>
            <p className="text-gray-400 max-w-sm">
              Cree grupos de productos para realizar aumentos de precios de forma masiva y eficiente.
            </p>
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        description={confirmConfig.description}
        variant={confirmConfig.variant}
        confirmLabel={confirmConfig.confirmLabel}
      />
    </div>
  );
}
