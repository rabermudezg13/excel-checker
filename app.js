import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelComparator = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedColumn1, setSelectedColumn1] = useState('');
  const [selectedColumn2, setSelectedColumn2] = useState('');
  const [columns1, setColumns1] = useState([]);
  const [columns2, setColumns2] = useState([]);

  const handleFileUpload = async (file, fileNumber) => {
    if (!file) return;
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0];
        
        if (fileNumber === 1) {
          setFile1({ data: jsonData, headers });
          setColumns1(headers);
          setSelectedColumn1(headers[0] || '');
        } else {
          setFile2({ data: jsonData, headers });
          setColumns2(headers);
          setSelectedColumn2(headers[0] || '');
        }
      }
    } catch (error) {
      alert('Error al leer el archivo. Asegúrate de que sea un archivo Excel válido.');
    }
  };

  const compareFiles = () => {
    if (!file1 || !file2 || !selectedColumn1 || !selectedColumn2) {
      alert('Por favor selecciona ambos archivos y las columnas a comparar');
      return;
    }

    setLoading(true);

    try {
      // Obtener índices de las columnas seleccionadas
      const col1Index = file1.headers.indexOf(selectedColumn1);
      const col2Index = file2.headers.indexOf(selectedColumn2);

      // Extraer nombres del primer archivo (excluyendo el header)
      const names1 = file1.data.slice(1)
        .map(row => row[col1Index])
        .filter(name => name && name.toString().trim() !== '')
        .map(name => name.toString().trim().toLowerCase());

      // Extraer nombres del segundo archivo (excluyendo el header)
      const names2 = file2.data.slice(1)
        .map(row => row[col2Index])
        .filter(name => name && name.toString().trim() !== '')
        .map(name => name.toString().trim());

      // Encontrar nombres que están en el segundo archivo pero NO en el primero
      const missingInFirst = names2.filter(name => 
        !names1.includes(name.toLowerCase())
      );

      // Encontrar nombres que están en el primer archivo pero NO en el segundo
      const missingInSecond = file1.data.slice(1)
        .map(row => row[col1Index])
        .filter(name => name && name.toString().trim() !== '')
        .map(name => name.toString().trim())
        .filter(name => !names2.map(n => n.toLowerCase()).includes(name.toLowerCase()));

      setResults({
        missingInFirst: [...new Set(missingInFirst)],
        missingInSecond: [...new Set(missingInSecond)],
        totalFile1: names1.length,
        totalFile2: names2.length
      });
    } catch (error) {
      alert('Error al comparar los archivos');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    const wb = XLSX.utils.book_new();
    
    // Hoja 1: Nombres que faltan en el primer archivo
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['Nombres que están en el segundo archivo pero NO en el primero'],
      [''],
      ...results.missingInFirst.map(name => [name])
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Faltan en Archivo 1');

    // Hoja 2: Nombres que faltan en el segundo archivo
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Nombres que están en el primer archivo pero NO en el segundo'],
      [''],
      ...results.missingInSecond.map(name => [name])
    ]);
    XLSX.utils.book_append_sheet(wb, ws2, 'Faltan en Archivo 2');

    XLSX.writeFile(wb, 'comparacion_resultados.xlsx');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Comparador de Excel
        </h1>
        <p className="text-gray-600">
          Compara dos archivos Excel y encuentra nombres que faltan
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Archivo 1 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Archivo Base (1)</h3>
            <p className="text-sm text-gray-500 mb-4">
              El archivo contra el cual comparar
            </p>
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Seleccionar Archivo
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0], 1)}
              />
            </label>
            {file1 && (
              <div className="mt-4 text-left">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Archivo cargado</span>
                </div>
                <label className="block text-sm font-medium mb-1">
                  Columna de nombres:
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedColumn1}
                  onChange={(e) => setSelectedColumn1(e.target.value)}
                >
                  {columns1.map((col, idx) => (
                    <option key={idx} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Archivo 2 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Archivo a Comparar (2)</h3>
            <p className="text-sm text-gray-500 mb-4">
              El archivo que quieres verificar
            </p>
            <label className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Seleccionar Archivo
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0], 2)}
              />
            </label>
            {file2 && (
              <div className="mt-4 text-left">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Archivo cargado</span>
                </div>
                <label className="block text-sm font-medium mb-1">
                  Columna de nombres:
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedColumn2}
                  onChange={(e) => setSelectedColumn2(e.target.value)}
                >
                  {columns2.map((col, idx) => (
                    <option key={idx} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón de comparar */}
      <div className="text-center mb-6">
        <button
          onClick={compareFiles}
          disabled={!file1 || !file2 || loading}
          className="bg-purple-500 text-white px-8 py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg font-medium"
        >
          {loading ? 'Comparando...' : 'Comparar Archivos'}
        </button>
      </div>

      {/* Resultados */}
      {results && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Resultados</h2>
            <button
              onClick={downloadResults}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar Resultados
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Nombres que faltan en el primer archivo */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-gray-800">
                  Faltan en Archivo Base ({results.missingInFirst.length})
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Nombres que están en el archivo 2 pero NO en el archivo 1:
              </p>
              <div className="max-h-40 overflow-y-auto">
                {results.missingInFirst.length > 0 ? (
                  <ul className="space-y-1">
                    {results.missingInFirst.map((name, idx) => (
                      <li key={idx} className="text-sm bg-red-50 px-2 py-1 rounded">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600 text-sm">✓ Todos los nombres están presentes</p>
                )}
              </div>
            </div>

            {/* Nombres que faltan en el segundo archivo */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <h3 className="font-medium text-gray-800">
                  Faltan en Archivo 2 ({results.missingInSecond.length})
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Nombres que están en el archivo 1 pero NO en el archivo 2:
              </p>
              <div className="max-h-40 overflow-y-auto">
                {results.missingInSecond.length > 0 ? (
                  <ul className="space-y-1">
                    {results.missingInSecond.map((name, idx) => (
                      <li key={idx} className="text-sm bg-yellow-50 px-2 py-1 rounded">
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600 text-sm">✓ Todos los nombres están presentes</p>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mt-6 bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Estadísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{results.totalFile1}</div>
                <div className="text-sm text-gray-600">Total Archivo 1</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{results.totalFile2}</div>
                <div className="text-sm text-gray-600">Total Archivo 2</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{results.missingInFirst.length}</div>
                <div className="text-sm text-gray-600">Faltan en 1</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{results.missingInSecond.length}</div>
                <div className="text-sm text-gray-600">Faltan en 2</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelComparator;
