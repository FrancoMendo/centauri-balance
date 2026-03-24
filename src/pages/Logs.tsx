import { useEffect, useState } from "react";
import { useLogsStore } from "../store/useLogsStore";
import { Button } from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";


export default function Logs() {
  const { logs, isLoading, error, getLogs, totalCountLogs } = useLogsStore();
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const getInitialData = () => {
    getLogs(ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE);
  }

  useEffect(() => {
    getInitialData();
  }, [currentPage]);

  useEffect(() => {
    console.log('totalCountLogs:', totalCountLogs)
    console.log('currentPage:', currentPage)
  }, [totalCountLogs, currentPage])


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">Logs</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-25" onClick={getInitialData}>Actualizar</Button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", height: "100vh" }}>
        {isLoading ? (
          <p>Cargando logs...</p>
        ) : error ? (
          <p>Error al cargar logs: {error}</p>
        ) : (
          <ul>
            {logs.map((log) => (
              <li className="border border-gray-200 rounded-md p-2" key={log.id_log}>
                <p>{log.fecha}</p>
                <p>{log.descripcion}</p>
              </li>
            ))}
          </ul>
        )}
        <Pagination
          currentPage={currentPage}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          totalCount={totalCountLogs}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  )
}