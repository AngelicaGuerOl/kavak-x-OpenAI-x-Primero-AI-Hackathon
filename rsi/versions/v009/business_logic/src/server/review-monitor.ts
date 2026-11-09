import type { Finding, ReviewItem } from '@/contracts/case';

const guidance: Record<string, Omit<ReviewItem, 'findingCode'>> = {
  ADDRESS_MISSING: {
    document: 'Comprobante de domicilio',
    field: 'Presencia del documento',
    proposedAction: 'Solicitar un comprobante de domicilio para completar el expediente antes de la revisión humana.',
  },
  RFC_MISMATCH: {
    document: 'Solicitud y constancia fiscal',
    field: 'RFC',
    proposedAction: 'Confirmar cuál RFC corresponde a los documentos sintéticos y corregir la discrepancia antes de la revisión humana.',
  },
  INE_EXPIRED: {
    document: 'Identificación',
    field: 'Fecha de vigencia',
    proposedAction: 'Solicitar una identificación vigente y actualizar el dato de vencimiento antes de la revisión humana.',
  },
};

export function createReviewItems(findings: Finding[]): ReviewItem[] {
  return findings.map((finding) => ({
    findingCode: finding.code,
    ...(guidance[finding.code] ?? {
      document: 'Expediente sintético',
      field: 'Dato señalado por el hallazgo',
      proposedAction: 'Revisar la evidencia registrada y determinar la corrección con una persona responsable.',
    }),
  }));
}
