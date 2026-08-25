/**
 * Direct File Downloader & Export Helper
 * Performs clean, direct browser file download for PDFs and Excel workbooks
 * without triggering system share sheets or opening unwanted dialogs.
 */

export function downloadBlobFile(blob: Blob, fileName: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1500);
    return true;
  } catch (error) {
    console.error('Error in downloadBlobFile:', error);
    try {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return true;
    } catch {
      return false;
    }
  }
}

export async function saveOrShareFile(
  blob: Blob,
  fileName: string,
  _title: string = 'EURO - Academic Report',
  _text: string = 'Generated from EURO - Unit Test 1 & 2 Management System'
): Promise<boolean> {
  // Always perform direct file download only to avoid opening unexpected system share sheets
  return downloadBlobFile(blob, fileName);
}

