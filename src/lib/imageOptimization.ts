/**
 * Utilidad nativa para optimizar imágenes en el cliente antes de la subida.
 * No utiliza servicios externos ni librerías pesadas.
 */

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp';
}

/**
 * Redimensiona y comprime una imagen usando Canvas API.
 * @param file El archivo original seleccionado por el usuario.
 * @param options Opciones de redimensionamiento y calidad.
 * @returns Un Blob con la imagen optimizada listo para subir.
 */
export const optimizeImage = async (
  file: File,
  options: OptimizationOptions = { maxWidth: 1200, maxHeight: 1200, quality: 0.8, format: 'image/jpeg' }
): Promise<Blob> => {
  // Si no es una imagen, devolvemos el archivo original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Si es un GIF, lo dejamos pasar ya que canvas lo convertiría en estático
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maxWidth = options.maxWidth || 1200;
        const maxHeight = options.maxHeight || 1200;

        // Mantener relación de aspecto
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo obtener el contexto del canvas'));
        }

        // Fondo blanco para JPEGs (evita transparencia negra)
        if (options.format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Si el blob resultante es más grande que el original (raro pero posible en imgs muy pequeñas),
              // devolvemos el original.
              if (blob.size > file.size) {
                resolve(file);
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error('Error en la conversión a Blob'));
            }
          },
          options.format || 'image/jpeg',
          options.quality || 0.8
        );
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen en el DOM'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
};

/**
 * Valida si un archivo cumple con los requisitos de tipo y tamaño máximo.
 */
export const validateFile = (file: File, allowedTypes: string[], maxMB: number = 5): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato de archivo no permitido.' };
  }
  
  if (file.size > maxMB * 1024 * 1024) {
    return { valid: false, error: `El archivo supera el límite de ${maxMB}MB.` };
  }
  
  return { valid: true };
};
