export const SELLER_STATE_CODE = '33';
export const SELLER_STATE_NAME = 'Tamil Nadu';

export const GST_STATE_CODES: Record<string, string> = {
  'JAMMU AND KASHMIR': '01',
  'HIMACHAL PRADESH': '02',
  'PUNJAB': '03',
  'CHANDIGARH': '04',
  'UTTARAKHAND': '05',
  'HARYANA': '06',
  'DELHI': '07',
  'RAJASTHAN': '08',
  'UTTAR PRADESH': '09',
  'BIHAR': '10',
  'SIKKIM': '11',
  'ARUNACHAL PRADESH': '12',
  'NAGALAND': '13',
  'MANIPUR': '14',
  'MIZORAM': '15',
  'TRIPURA': '16',
  'MEGHALAYA': '17',
  'ASSAM': '18',
  'WEST BENGAL': '19',
  'JHARKHAND': '20',
  'ODISHA': '21',
  'ORISSA': '21',
  'CHHATTISGARH': '22',
  'MADHYA PRADESH': '23',
  'GUJARAT': '24',
  'DAMAN AND DIU': '25',
  'DADRA AND NAGAR HAVELI': '26',
  'MAHARASHTRA': '27',
  'ANDHRA PRADESH (OLD)': '28',
  'KARNATAKA': '29',
  'GOA': '30',
  'LAKSHADWEEP': '31',
  'KERALA': '32',
  'TAMIL NADU': '33',
  'TAMILNADU': '33',
  'PUDUCHERRY': '34',
  'PONDICHERRY': '34',
  'ANDAMAN AND NICOBAR ISLANDS': '35',
  'TELANGANA': '36',
  'ANDHRA PRADESH': '37',
  'LADAKH': '38',
  'OTHER TERRITORY': '97',

  // Common Short codes
  'TN': '33',
  'KL': '32',
  'KA': '29',
  'AP': '37',
  'TS': '36',
  'TG': '36',
  'MH': '27',
  'DL': '07',
  'GA': '30',
  'GJ': '24',
  'RJ': '08',
  'UP': '09',
  'WB': '19',
  'MP': '23',
  'BR': '10',
  'HR': '06',
  'PB': '03',
  'PY': '34',
};

export function resolveGstStateCode(input: string | number | undefined | null): string {
  if (!input) return SELLER_STATE_CODE;
  const str = String(input).trim().toUpperCase();

  // If already numeric 2-digit code
  if (/^\d{1,2}$/.test(str)) {
    return str.padStart(2, '0');
  }

  // Exact match in state code map
  if (GST_STATE_CODES[str]) {
    return GST_STATE_CODES[str];
  }

  // Common prefix / inclusion checks
  if (str.includes('TAMIL')) {
    return '33';
  }
  if (str.includes('KERALA')) {
    return '32';
  }

  for (const [name, code] of Object.entries(GST_STATE_CODES)) {
    if (str.includes(name) || name.includes(str)) {
      return code;
    }
  }

  return '99';
}

export const normalizeStateCode = resolveGstStateCode;

export type SupplyType = 'INTRA_STATE' | 'INTER_STATE';

export function getSupplyType(customerState: string | number | undefined | null): SupplyType {
  const code = resolveGstStateCode(customerState);
  return code === SELLER_STATE_CODE ? 'INTRA_STATE' : 'INTER_STATE';
}

export interface GstBreakdown {
  supplyType: SupplyType;
  sellerStateCode: string;
  customerStateCode: string;
  taxableAmount: number;
  totalGst: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
}

export function computeGstBreakdown(
  taxableAmount: number,
  totalGst: number,
  customerState: string | number | undefined | null
): GstBreakdown {
  const customerStateCode = resolveGstStateCode(customerState);
  const supplyType: SupplyType = customerStateCode === SELLER_STATE_CODE ? 'INTRA_STATE' : 'INTER_STATE';

  const roundedTaxable = Math.round(taxableAmount * 100) / 100;
  const roundedGst = Math.round(totalGst * 100) / 100;

  if (supplyType === 'INTRA_STATE') {
    const cgst = Math.round((roundedGst / 2) * 100) / 100;
    const sgst = Math.round((roundedGst - cgst) * 100) / 100;
    return {
      supplyType,
      sellerStateCode: SELLER_STATE_CODE,
      customerStateCode,
      taxableAmount: roundedTaxable,
      totalGst: roundedGst,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: 0,
    };
  } else {
    return {
      supplyType,
      sellerStateCode: SELLER_STATE_CODE,
      customerStateCode,
      taxableAmount: roundedTaxable,
      totalGst: roundedGst,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: roundedGst,
    };
  }
}
