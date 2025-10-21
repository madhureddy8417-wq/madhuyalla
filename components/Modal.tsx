

import React, { useEffect, useRef } from 'react';
import type { ModalType, SuitableCropInfo, MarketInfo, GovernmentScheme, FarmingMaterial, SuitableSpeciesInfo, AquaMarketInfo, AquaScheme, AquaFarmingMaterial } from '../types';
import { ExportIcon } from './icons';

// Declare global variables from CDN scripts
declare const html2canvas: any;
declare const jspdf: any;

// --- EXPORT LOGIC ---
const escapeCsvField = (field: any): string => {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const createCsvContent = (data: any, modalType: ModalType, appMode: 'agri' | 'aqua'): string => {
    let headers: string[] = [];
    let csvData: any[] = [];

    if (appMode === 'agri') {
        switch (modalType) {
            case 'soil':
                headers = ['Crop Name', 'Suitability', 'Sowing Season', 'Water Requirement', 'Potential Yield', 'Avg Market Price'];
                csvData = (data as SuitableCropInfo[]).map(item => ({ ...item }));
                break;
            case 'market':
                headers = ['Market Name', 'Distance', 'Crop Name', 'Demand', 'Price Per Kg', 'Price Trend'];
                csvData = (data as MarketInfo[]).flatMap(market => 
                    market.availableCrops.map(crop => ({ marketName: market.marketName, distance: market.distance, ...crop }))
                );
                break;
            case 'schemes':
                headers = ['Name', 'Description', 'Eligibility', 'Application Deadline', 'Link'];
                csvData = (data as GovernmentScheme[]).map(item => ({ ...item }));
                break;
            case 'materials':
                headers = ['Name', 'Description', 'Usage', 'Estimated Price', 'Local Sourcing'];
                csvData = (data as FarmingMaterial[]).map(item => ({ ...item }));
                break;
            default: return '';
        }
    } else { // appMode === 'aqua'
        switch (modalType) {
            case 'soil': // Represents "Water & Species"
                headers = ['Species Name', 'Suitability', 'Stocking Season', 'Water Parameters', 'Potential Yield', 'Avg Market Price'];
                csvData = (data as SuitableSpeciesInfo[]).map(item => ({ ...item }));
                break;
            case 'market':
                headers = ['Market Name', 'Distance', 'Species Name', 'Demand', 'Price Per Kg', 'Price Trend'];
                csvData = (data as AquaMarketInfo[]).flatMap(market =>
                    market.availableSpecies.map(species => ({ marketName: market.marketName, distance: market.distance, ...species }))
                );
                break;
            case 'schemes':
                headers = ['Name', 'Description', 'Eligibility', 'Application Deadline', 'Link'];
                csvData = (data as AquaScheme[]).map(item => ({ ...item }));
                break;
            case 'materials':
                headers = ['Name', 'Description', 'Usage', 'Estimated Price', 'Local Sourcing'];
                csvData = (data as AquaFarmingMaterial[]).map(item => ({ ...item }));
                break;
            default: return '';
        }
    }

    const headerRow = headers.join(',');
    const dataRows = csvData.map(row => 
        Object.values(row).map(escapeCsvField).join(',')
    ).join('\n');
    
    // Manually map properties to headers to ensure order
    const orderedDataRows = csvData.map(row => {
        const keys = Object.keys(row);
        return headers.map(header => {
            // Find a key in the row that loosely matches the header
            const key = keys.find(k => header.toLowerCase().replace(/[^a-z0-9]/gi, '') === k.toLowerCase().replace(/[^a-z0-9]/gi, ''))
            return escapeCsvField(key ? row[key] : '');
        }).join(',');
    }).join('\n');


    return `${headerRow}\n${orderedDataRows}`;
};


const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

const exportToCsv = (data: any, modalType: ModalType, appMode: 'agri' | 'aqua', fileName: string) => {
    const csvContent = createCsvContent(data, modalType, appMode);
    if (csvContent) {
        downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
    }
};

export const exportToPdf = async (elementId: string, fileName: string) => {
    try {
        const { jsPDF } = jspdf;
        const input = document.getElementById(elementId);
        if (!input) {
            console.error(`Element with id "${elementId}" not found.`);
            return;
        }

        const canvas = await html2canvas(input, {
          scale: 2, // Improve resolution
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName}.pdf`);
    } catch (error) {
        console.error("Error exporting to PDF:", error);
    }
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  modalData?: any;
  activeModal?: ModalType | null;
  appMode: 'agri' | 'aqua';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, modalData, activeModal, appMode }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleExportPdf = () => {
      exportToPdf('modal-content-to-export', title.replace(/ /g, '_'));
  };
  
  const handleExportCsv = () => {
    if (modalData && activeModal) {
      exportToCsv(modalData, activeModal, appMode, title.replace(/ /g, '_'));
    }
  };

  const isCsvExportable = activeModal && ['soil', 'market', 'schemes', 'materials'].includes(activeModal);
  const showExportButtons = modalData && activeModal !== 'assistant' && activeModal !== 'map' && activeModal !== 'water';

  const modalSizeClass = (activeModal === 'map' || activeModal === 'water') ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div ref={modalRef} className={`bg-white rounded-lg shadow-xl w-full ${modalSizeClass} max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id="modal-content-to-export" className="p-6 overflow-y-auto">
          {children}
        </div>
        {showExportButtons && (
          <div className="flex justify-end items-center p-4 border-t gap-2">
            <button onClick={handleExportPdf} className="flex items-center gap-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-3 rounded-lg transition duration-300">
                <ExportIcon />
                <span>Export PDF</span>
            </button>
            {isCsvExportable && (
                <button onClick={handleExportCsv} className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition duration-300">
                    <ExportIcon />
                    <span>Export CSV</span>
                </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;