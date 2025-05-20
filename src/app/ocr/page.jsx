"use client";

import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function CarnetExtractor() {
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFrontImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFrontImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const cleanText = (text) => {
        return text
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
            .trim();
    };

    const extractTextFromImage = async (image) => {
        const { data: { text } } = await Tesseract.recognize(
            image,
            'spa',
            { logger: m => console.log(m) }
        );
        return cleanText(text);
    };

    const processFormat1 = (frontText, backText) => {
        // Extraer número de CI del anverso (después de "No.")
        const ciMatch = frontText.match(/No\.?\s*(\d{5,8})/i);
        const ci = ciMatch ? ciMatch[1] : null;

        // Extraer nombre completo del reverso (ignorando texto previo)
        const nameSection = backText.split('pertenece').pop() || '';
        const nameMatch = nameSection.match(/^\s*([A-ZÁÉÍÓÚÑ\s]+)(?=\s*Nacido)/i);
        let fullName = nameMatch ? nameMatch[1].trim() : '';

        // Limpiar y separar nombres y apellidos
        fullName = fullName.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '').trim();
        const nameParts = fullName.split(/\s+/).filter(part => part.length > 1);

        let nombres = '', apellidoPaterno = '-', apellidoMaterno = '-';

        if (nameParts.length >= 2) {
            // Caso especial para "Vda. de" o "de"
            if (nameParts.includes('Vda.')) {
                const vdaIndex = nameParts.indexOf('Vda.');
                nombres = nameParts.slice(0, vdaIndex).join(' ');
                apellidoMaterno = nameParts.slice(vdaIndex).join(' ');
            } else if (nameParts.includes('de')) {
                const deIndex = nameParts.indexOf('de');
                nombres = nameParts.slice(0, deIndex).join(' ');
                apellidoMaterno = nameParts.slice(deIndex).join(' ');
            } else {
                // Caso normal: primeros 2 elementos son nombres, luego apellidos
                nombres = nameParts.slice(0, 2).join(' ');
                if (nameParts.length > 2) apellidoPaterno = nameParts[2];
                if (nameParts.length > 3) apellidoMaterno = nameParts.slice(3).join(' ');
            }
        }

        // Extraer fecha de nacimiento (formato: "Nacido el 8 de Mayo de 1997")
        const dobMatch = backText.match(/Nacido el\s*(\d{1,2}\s+de\s+[A-Za-z]+\s+de\s+\d{4})/i);
        const fechaNacimiento = dobMatch ? dobMatch[1] : null;

        // Extraer lugar de nacimiento (primera palabra después de "En")
        const placeMatch = backText.match(/En\s*([^-—]+)/i);
        let lugarNacimiento = placeMatch ? placeMatch[1].trim().split(/\s+/)[0] : null;

        // Extraer estado civil (SOLTERA, CASADA, etc.)
        const civilMatch = backText.match(/Estado Civil\s*([A-Z]+)\s*/i);
        const estadoCivil = civilMatch ? civilMatch[1] : null;

        // Extraer ocupación (después de "Profesión/Ocupación")
        const occupationMatch = backText.match(/Profesi[óo]n\/?Ocupaci[óo]n\s*([^\n]+)/i);
        const ocupacion = occupationMatch ? occupationMatch[1].trim() : null;

        // Extraer domicilio (después de "Domicilio")
        const addressMatch = backText.match(/Domicilio\s*([^\n]+)/i);
        const domicilio = addressMatch ? addressMatch[1].trim() : null;

        return {
            ci,
            nombres: nombres || 'No encontrado',
            apellidoPaterno,
            apellidoMaterno,
            fechaNacimiento,
            lugarNacimiento,
            estadoCivil,
            ocupacion,
            domicilio,
            formato: 'Formato 1'
        };
    };

    const processFormat2 = (frontText, backText) => {
        // Función mejorada de limpieza de texto OCR
        const cleanText = (text) => {
            return text
                .replace(/\n/g, ' ') // Reemplazar saltos de línea
                .replace(/\s+/g, ' ') // Eliminar múltiples espacios
                .replace(/[^a-zA-Z0-9ÁÉÍÓÚÑáéíóúñ\s\-:\/°]/g, '') // Eliminar caracteres especiales no deseados
                .replace(/(\d)\s+(\d)/g, '$1$2') // Unir números separados por espacios
                .trim();
        };

        // 1. Procesamiento del ANVERSO (frontal)
        const processFront = (text) => {
            text = cleanText(text);
            console.log("[ANVERSO PROCESADO]:", text); // Para diagnóstico

            // Extraer CI - Patrón más robusto
            const ciMatch = text.match(/(?:CÉDULA DE IDENTIDAD|CI|N°)\s*[:]?\s*(\d{5,8})/i) ||
                text.match(/\b(\d{7,8})\b/); // Buscar cualquier número de 7-8 dígitos
            const ci = ciMatch ? ciMatch[1] : 'No encontrado';

            // Extraer NOMBRES - Patrón específico para tu formato
            const nombresMatch = text.match(/NOMBRES\s*:\s*([A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ]+)/i) ||
                text.match(/NOMBRES\s*([A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ]+)/i);
            const nombres = nombresMatch ? nombresMatch[1].trim() : 'No encontrado';

            // Extraer APELLIDOS - Patrón específico
            const apellidosMatch = text.match(/APELLIDOS\s*:\s*([A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ]+)/i) ||
                text.match(/APELLIDOS\s*([A-ZÁÉÍÓÚÑ]+\s+[A-ZÁÉÍÓÚÑ]+)/i);
            const apellidos = apellidosMatch ? apellidosMatch[1].trim() : 'No encontrado';

            // Separación de apellidos
            let apellidoPaterno = '-';
            let apellidoMaterno = '-';
            if (apellidos !== 'No encontrado') {
                const apellidosParts = apellidos.split(/\s+/);
                apellidoPaterno = apellidosParts[0] || '-';
                apellidoMaterno = apellidosParts.slice(1).join(' ') || '-';
            }

            return { ci, nombres, apellidoPaterno, apellidoMaterno };
        };

        // 2. Procesamiento del REVERSO (posterior)
        const processBack = (text) => {
            // Limpieza mejorada manteniendo estructura clave
            const cleanedText = text
                .replace(/[^a-zA-Z0-9ÁÉÍÓÚÑáéíóúñ\s\-:\/°#,]/g, ' ') // Conservar caracteres útiles
                .replace(/\b\w{1,2}\b/g, ' ') // Eliminar palabras muy cortas (ruido)
                .replace(/\s+/g, ' ')
                .trim();

            console.log("TEXTO REVERSO LIMPIO MEJORADO:", cleanedText);

            // 1. FECHA NACIMIENTO - Buscar patrón DD/MM/AAAA o similar
            const fechaNacimiento = cleanedText.match(/(\d{2}[\/-]\d{2}[\/-]\d{4})/)?.[0]?.replace(/-/g, '/') ||
                cleanedText.match(/(\d{8})/)?.[0]?.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3') ||
                'No encontrado';

            // 2. LUGAR NACIMIENTO - Buscar "LA PAZ" específicamente
            const lugarNacimiento = cleanedText.match(/(LA PAZ|ORURO|POTOSI|COCHABAMBA|SANTA CRUZ|BENI|PANDO|TARIJA|SUCRE)/i)?.[0] ||
                'No encontrado';

            // 3. OCUPACIÓN - Buscar después de "OCUPACIÓN"
            const ocupacion = cleanedText.match(/OCUPACIÓN\s*([A-ZÁÉÍÓÚÑ]+)/i)?.[1] ||
                cleanedText.match(/ESTUDIANTE|PROFESOR|MEDICO|INGENIERO|ABOGADO/i)?.[0] ||
                'No encontrado';

            // 4. ESTADO CIVIL - Buscar después de "ESTADO CIVIL"
            const estadoCivil = cleanedText.match(/ESTADO CIVIL\s*([A-ZÁÉÍÓÚÑ]+)/i)?.[1] ||
                cleanedText.match(/SOLTER[OA]|CASAD[OA]|DIVORCIAD[OA]|VIUD[OA]/i)?.[0] ||
                'No encontrado';

            // 5. DOMICILIO - Extraer todo después de "DOMICILIO" hasta el siguiente campo
            const domicilioMatch = cleanedText.match(/(CALLE|AV\.|AVENIDA|BARRIO|ZONA).+?(?=(OCUPACIÓN|ESTADO CIVIL|$))/i);
            const domicilio = domicilioMatch?.[0]?.replace(/\s+/g, ' ').trim() || 'No encontrado';

            return {
                fechaNacimiento,
                lugarNacimiento,
                ocupacion,
                estadoCivil,
                domicilio
            };
        };

        // Procesar ambos lados
        const frontData = processFront(frontText);
        const backData = processBack(backText);



        return {
            ...frontData,
            ...backData,
            formato: 'Formato 2'
        };
    };
    // Función extractData actualizada
    const extractData = async () => {
        if (!frontImage || !backImage) {
            alert('Debe subir ambas imágenes (anverso y reverso)');
            return;
        }

        setIsLoading(true);
        try {
            const [frontText, backText] = await Promise.all([
                extractTextFromImage(frontImage),
                extractTextFromImage(backImage)
            ]);

            console.log("=== TEXTO ANVERSO ===", frontText);
            console.log("=== TEXTO REVERSO ===", backText);

            // Procesar como Formato 2
            const result = processFormat2(frontText, backText);

            // Validación mejorada
            if (result.ci === 'No encontrado' || result.nombres === 'No encontrado') {
                console.warn("Datos frontales faltantes:", result);
            }
            if (result.fechaNacimiento === 'No encontrado' || result.lugarNacimiento === 'No encontrado') {
                console.warn("Datos posteriores faltantes:", result);
            }

            setExtractedData(result);
        } catch (error) {
            console.error("Error en extracción:", error);
            alert(`Error al procesar: ${error.message}\n\nConsulte la consola para más detalles.`);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
                    Lector de Carnet de Identidad Boliviano
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Anverso del carnet:
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFrontImageUpload}
                            className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                        />
                        {frontImage && (
                            <img
                                src={frontImage}
                                alt="Anverso del carnet"
                                className="mt-2 max-w-full h-auto rounded border border-gray-300"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reverso del carnet:
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackImageUpload}
                            className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                        />
                        {backImage && (
                            <img
                                src={backImage}
                                alt="Reverso del carnet"
                                className="mt-2 max-w-full h-auto rounded border border-gray-300"
                            />
                        )}
                    </div>
                </div>

                <button
                    onClick={extractData}
                    disabled={isLoading || !frontImage || !backImage}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Procesando...
                        </>
                    ) : 'Extraer datos'}
                </button>

                {extractedData && (
                    <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200">
                        <h2 className="text-lg font-semibold mb-3 text-center">Datos extraídos ({extractedData.formato})</h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">CI:</span>
                                <span className="col-span-2 font-mono">{extractedData.ci || 'No encontrado'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Nombres:</span>
                                <span className="col-span-2 font-medium">{extractedData.nombres || 'No encontrado'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Apellido Paterno:</span>
                                <span className="col-span-2">{extractedData.apellidoPaterno}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Apellido Materno:</span>
                                <span className="col-span-2">{extractedData.apellidoMaterno}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Fecha Nacimiento:</span>
                                <span className="col-span-2">{extractedData.fechaNacimiento || 'No encontrado'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Lugar Nacimiento:</span>
                                <span className="col-span-2">{extractedData.lugarNacimiento || 'No encontrado'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Estado Civil:</span>
                                <span className="col-span-2">{extractedData.estadoCivil || 'No encontrado'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Ocupación:</span>
                                <span className="col-span-2">{extractedData.ocupacion || 'No encontrado'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-sm font-medium text-gray-500">Domicilio:</span>
                                <span className="col-span-2">{extractedData.domicilio || 'No encontrado'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 text-xs text-gray-500">
                    <p>Nota: Para mejores resultados, asegúrese de que las imágenes sean claras y estén bien iluminadas.</p>
                </div>
            </div>
        </div>
    );
}