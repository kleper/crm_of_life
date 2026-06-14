# Licencias de Sonidos

## Documentación de Búsqueda
Durante la fase de investigación (Parte A) se exploraron fuentes como Mixkit, Pixabay y Freesound.org en busca de archivos de audio MP3 para notificaciones que cumplieran con el licenciamiento CC0 estricto (sin restricciones comerciales ni requisitos de atribución complejos).

Debido a las restricciones de descarga automatizada (protección anti-scraping en CDNs de Mixkit y Pixabay) y para evitar cualquier posible fricción legal con archivos multimedia de terceros o impacto en la cuota de almacenamiento/cacheo (archivos MP3), se ha decidido **optar por la alternativa autorizada en la Parte A.3**:

### Solución Adoptada: Web Audio API (Sonido Sintético)
En lugar de depender de archivos `.mp3` estáticos, la aplicación genera los sonidos de notificación dinámicamente en tiempo de ejecución utilizando la **Web Audio API** del navegador. 

Esto presenta múltiples ventajas:
- **0 dependencias externas**: No hay problemas de licencias, derechos de autor o necesidad de atribuciones.
- **0 KB de peso extra**: No impacta el tamaño del bundle, ni requiere caché adicional en el Service Worker.
- **Diseño a medida**: Permite generar un sonido corto y suave ("ding") para notificaciones por defecto, y un sonido celebratorio (acorde ascendente) para los reconocimientos (Kudos), alineado con la identidad calmada de la aplicación.

Por tanto, este directorio no contendrá archivos `.mp3` físicos, y toda la lógica sonora reside en el componente cliente `NotificationSoundListener`.
