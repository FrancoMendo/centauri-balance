import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface PraginationProps {
  currentPage: number;
  ITEMS_PER_PAGE?: number;
  totalCount: number;
  isLoading?: boolean;
  error?: string | null;
  onPageChange: (page: number) => void;
}
export default function Pagination({ currentPage, ITEMS_PER_PAGE = 20, totalCount, isLoading = false, error = null, onPageChange }: PraginationProps) {
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const handlePageChange = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    !isLoading && !error && totalPages > 1 && (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-4 bg-white rounded-b-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
          >
            Anterior
          </Button>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Siguiente
          </Button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}</span> de <span className="font-medium">{totalCount}</span> resultados
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Siguiente</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    )
  )
}