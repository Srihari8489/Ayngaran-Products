import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Receipt, Search, Barcode, ShoppingCart, Plus, Minus, Trash2,
  CheckCircle2, Printer, Download, RefreshCw, X, User, Phone,
  CreditCard, Banknote, QrCode, ArrowRight, RotateCcw, AlertTriangle,
  Calendar, ChevronRight, FileText, TrendingUp, ShieldCheck, Tag,
  Clock, Filter, Eye, ArrowUpRight, DollarSign, Store, Sparkles
} from 'lucide-react';
import adminApi from '../api/client';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { Pagination } from '../components/Pagination';
import { AdminModal } from '../components/AdminModal';
import { SpotBillInvoiceModal } from '../components/SpotBillInvoiceModal';
import { GST_STATE_CODES } from '../utils/gst.util';
import { SpotBill, PaginationMeta } from '../types';

export const SpotBillingPage: React.FC = () => {
  const { staff, hasPermission } = useAdminAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: NEW_BILL | HISTORY | INVOICES | RETURNS | REPORTS
  const tabFromUrl = searchParams.get('tab');
  const getInitialTab = (): 'NEW_BILL' | 'HISTORY' | 'INVOICES' | 'RETURNS' | 'REPORTS' => {
    if (tabFromUrl === 'history') return 'HISTORY';
    if (tabFromUrl === 'invoices') return 'INVOICES';
    if (tabFromUrl === 'returns') return 'RETURNS';
    if (tabFromUrl === 'reports') return 'REPORTS';
    return 'NEW_BILL';
  };

  const [activeTab, setActiveTab] = useState<'NEW_BILL' | 'HISTORY' | 'INVOICES' | 'RETURNS' | 'REPORTS'>(getInitialTab);

  // Sync tab with URL query parameter
  const handleTabChange = (tab: 'NEW_BILL' | 'HISTORY' | 'INVOICES' | 'RETURNS' | 'REPORTS') => {
    setActiveTab(tab);
    const paramVal = tab === 'NEW_BILL' ? 'new-bill' : tab.toLowerCase();
    setSearchParams({ tab: paramVal });
  };

  useEffect(() => {
    if (tabFromUrl === 'new-bill' && activeTab !== 'NEW_BILL') setActiveTab('NEW_BILL');
    else if (tabFromUrl === 'history' && activeTab !== 'HISTORY') setActiveTab('HISTORY');
    else if (tabFromUrl === 'invoices' && activeTab !== 'INVOICES') setActiveTab('INVOICES');
    else if (tabFromUrl === 'returns' && activeTab !== 'RETURNS') setActiveTab('RETURNS');
    else if (tabFromUrl === 'reports' && activeTab !== 'REPORTS') setActiveTab('REPORTS');
  }, [tabFromUrl]);

  // ══════════════════════════════════════════════════════════════
  // TAB 1: NEW BILL (POS REGISTER) STATE
  // ══════════════════════════════════════════════════════════════
  const [productSearch, setProductSearch] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 250);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Helper functions for variant label and price extraction
  const formatVariantLabel = (v: any): string => {
    if (v?.variantLabel && v.variantLabel !== 'Standard') return v.variantLabel;
    if (v?.title) return v.title;
    if (v?.weight !== undefined && v?.weight !== null && v?.weight !== '') {
      const w = Number(v.weight);
      if (!isNaN(w) && w > 0) {
        if (w < 1) return `${Math.round(w * 1000)}g`;
        if (w < 10) return `${w}kg`;
        if (w >= 1000) return `${w / 1000}kg`;
        return `${w}g`;
      }
    }
    return v?.variantLabel || 'Standard';
  };

  const extractUnitPrice = (v: any, fallback?: any): number => {
    const p = v?.price ?? v?.sellingPrice ?? v?.mrp ?? fallback;
    const num = Number(p);
    return isNaN(num) ? 0 : num;
  };

  // Cart Items
  interface CartItem {
    productId: number | string;
    variantId?: number | string;
    productName: string;
    productCode?: string;
    brandName?: string;
    sku: string;
    variantLabel?: string;
    unitPrice: number;
    stockQuantity: number;
    quantity: number;
    gstRate: number;
    image?: string;
  }
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Helper to query item status in current cart
  const getCartItemInfo = (productId: any, variantId?: any) => {
    const idx = cartItems.findIndex(ci =>
      Number(ci.productId) === Number(productId) &&
      (variantId ? Number(ci.variantId) === Number(variantId) : !ci.variantId)
    );
    return {
      index: idx,
      item: idx > -1 ? cartItems[idx] : null,
      quantity: idx > -1 ? cartItems[idx].quantity : 0,
    };
  };

  // Customer Mode: 'WALK_IN' | 'REGISTERED'
  const [customerMode, setCustomerMode] = useState<'WALK_IN' | 'REGISTERED'>('WALK_IN');
  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Customer fields
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerState, setCustomerState] = useState('Tamil Nadu');
  const [customerNotes, setCustomerNotes] = useState('');

  // Discount
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Calculated Preview Breakdown
  const [calculation, setCalculation] = useState<{
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTaxAmount: number;
    grandTotal: number;
    isInterState: boolean;
  }>({
    subtotal: 0,
    discountAmount: 0,
    taxableAmount: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    totalTaxAmount: 0,
    grandTotal: 0,
    isInterState: false,
  });

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [upiReference, setUpiReference] = useState('');
  const [cardReference, setCardReference] = useState('');

  // Submitting Bill
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const [billError, setBillError] = useState('');

  // Success State & Floating Snackbar Notification
  const [completedBill, setCompletedBill] = useState<SpotBill | null>(null);
  const [snackbar, setSnackbar] = useState<{
    id: number;
    message: string;
    bill?: SpotBill;
    subText?: string;
  } | null>(null);
  const snackbarTimerRef = useRef<any>(null);

  const showSnackbar = (message: string, bill?: SpotBill, subText?: string) => {
    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
    }
    setSnackbar({
      id: Date.now(),
      message,
      bill,
      subText,
    });
    snackbarTimerRef.current = setTimeout(() => {
      setSnackbar(null);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
    };
  }, []);

  // Modal to View / Print Invoice
  const [invoiceModalBill, setInvoiceModalBill] = useState<SpotBill | null>(null);

  // ══════════════════════════════════════════════════════════════
  // TAB 2: BILLING HISTORY STATE
  // ══════════════════════════════════════════════════════════════
  const [historyBills, setHistoryBills] = useState<SpotBill[]>([]);
  const [historyPagination, setHistoryPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(20);
  const [historySearch, setHistorySearch] = useState('');
  const debouncedHistorySearch = useDebounce(historySearch, 350);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState('ALL');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [billToCancel, setBillToCancel] = useState<SpotBill | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 3: INVOICES STATE
  // ══════════════════════════════════════════════════════════════
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const debouncedInvoiceSearch = useDebounce(invoiceSearch, 350);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesLimit, setInvoicesLimit] = useState(20);

  // ══════════════════════════════════════════════════════════════
  // TAB 4: RETURNS & REFUNDS STATE
  // ══════════════════════════════════════════════════════════════
  const [returnBillIdSearch, setReturnBillIdSearch] = useState('');
  const [returnSelectedBill, setReturnSelectedBill] = useState<SpotBill | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [returnRefundMethod, setReturnRefundMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'ORIGINAL'>('CASH');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  // ══════════════════════════════════════════════════════════════
  // TAB 5: REPORTS STATE
  // ══════════════════════════════════════════════════════════════
  const [reportDateRange, setReportDateRange] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('TODAY');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // PRODUCT SEARCH EFFECT (API-based, Debounced)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      if (!debouncedProductSearch || debouncedProductSearch.trim().length < 1) {
        setSearchResults([]);
        setIsSearchingProducts(false);
        return;
      }

      try {
        setIsSearchingProducts(true);
        const res: any = await adminApi.get(`/spot-bills/products/search?q=${encodeURIComponent(debouncedProductSearch.trim())}`);
        const items = res?.data || res || [];
        const list = Array.isArray(items) ? items : [];
        setSearchResults(list);
        if (list.length > 0) {
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Failed to search products:', err);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearchingProducts(false);
      }
    };

    fetchProducts();
  }, [debouncedProductSearch]);

  // Handle USB Barcode scanner input (Press Enter)
  const handleBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = productSearch.trim();
      if (!code) return;

      try {
        setIsSearchingProducts(true);
        const res: any = await adminApi.get(`/spot-bills/products/search?q=${encodeURIComponent(code)}`);
        const items = res?.data || res || [];
        if (Array.isArray(items) && items.length > 0) {
          // If exact match found on SKU or barcode
          let matchedVariant: any = null;
          let matchedProduct: any = null;

          for (const prod of items) {
            for (const v of prod.variants || []) {
              if (
                v.sku?.toLowerCase() === code.toLowerCase() ||
                v.barcode?.toLowerCase() === code.toLowerCase() ||
                prod.productCode?.toLowerCase() === code.toLowerCase()
              ) {
                matchedVariant = v;
                matchedProduct = prod;
                break;
              }
            }
            if (matchedVariant) break;
          }

          // If no exact match on SKU/barcode, take the first product & first variant
          if (!matchedProduct && items.length === 1) {
            matchedProduct = items[0];
            matchedVariant = items[0].variants?.[0] || null;
          }

          if (matchedProduct) {
            addProductToCart(matchedProduct, matchedVariant);
            setProductSearch('');
            setSearchResults([]);
            return;
          }
        }
        setBillError(`Product or barcode "${code}" not found.`);
        setTimeout(() => setBillError(''), 3000);
      } catch (err) {
        console.error('Barcode search error:', err);
      } finally {
        setIsSearchingProducts(false);
      }
    }
  };

  // Add Product / Variant to Cart
  const addProductToCart = (product: any, variant?: any) => {
    setBillError('');
    const targetVariant = variant || (product.variants && product.variants.length > 0 ? product.variants[0] : null);
    const sku = targetVariant ? targetVariant.sku : (product.sku || product.productCode || 'N/A');
    const unitPrice = extractUnitPrice(targetVariant, product.basePrice ?? product.price);
    const stockQuantity = targetVariant ? Number(targetVariant.stockQuantity ?? 0) : (Number(product.stockQuantity) || 999);
    const variantId = targetVariant ? targetVariant.id : undefined;
    const variantLabel = targetVariant ? formatVariantLabel(targetVariant) : undefined;
    const gstRate = Number(product.effectiveGstRate ?? product.gstRate ?? product.category?.gstRate ?? 5);
    const image = product.imageUrl || product.images?.[0]?.url || product.thumbnailUrl;

    if (stockQuantity <= 0) {
      setBillError(`Out of stock: ${product.name} (${variantLabel || 'Standard'})`);
      setTimeout(() => setBillError(''), 3000);
      return;
    }

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item =>
        Number(item.productId) === Number(product.id) &&
        (variantId ? Number(item.variantId) === Number(variantId) : !item.variantId)
      );

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty + 1 > stockQuantity) {
          setBillError(`Only ${stockQuantity} units available for ${product.name}`);
          setTimeout(() => setBillError(''), 3000);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: currentQty + 1 };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            variantId,
            productName: product.name,
            productCode: product.productCode,
            brandName: product.brand?.name,
            sku,
            variantLabel,
            unitPrice,
            stockQuantity,
            quantity: 1,
            gstRate,
            image,
          },
        ];
      }
    });
  };

  // Update Cart Item Quantity
  const updateCartQuantity = (index: number, newQty: number) => {
    setBillError('');
    setCartItems(prev => {
      const target = prev[index];
      if (!target) return prev;

      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }

      if (newQty > target.stockQuantity) {
        setBillError(`Only ${target.stockQuantity} units available for ${target.productName}`);
        setTimeout(() => setBillError(''), 3000);
        return prev;
      }

      const updated = [...prev];
      updated[index] = { ...target, quantity: newQty };
      return updated;
    });
  };

  // Remove Item from Cart
  const removeCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Clear Entire Bill Cart
  const handleClearCart = (confirmPrompt = true) => {
    if (confirmPrompt && cartItems.length > 0) {
      if (!window.confirm('Current bill has unsaved items. Start a new bill?')) {
        return;
      }
    }
    setCartItems([]);
    setCustomerMode('WALK_IN');
    setSelectedCustomer(null);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerGstin('');
    setCustomerNotes('');
    setCustomerState('Tamil Nadu');
    setDiscountType('FIXED');
    setDiscountValue(0);
    setPaymentMethod('CASH');
    setAmountReceived(0);
    setUpiReference('');
    setCardReference('');
    setBillError('');
    setCompletedBill(null);
  };

  // ──────────────────────────────────────────────────────────────
  // CUSTOMER SEARCH EFFECT
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!debouncedCustomerSearch || debouncedCustomerSearch.trim().length < 2) {
        setCustomerResults([]);
        setIsSearchingCustomers(false);
        return;
      }

      try {
        setIsSearchingCustomers(true);
        const res: any = await adminApi.get(`/spot-bills/customers/search?q=${encodeURIComponent(debouncedCustomerSearch.trim())}`);
        const items = res?.data || res || [];
        setCustomerResults(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Failed to search customers:', err);
      } finally {
        setIsSearchingCustomers(false);
      }
    };

    fetchCustomers();
  }, [debouncedCustomerSearch]);

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    setCustomerName(cust.name || 'Customer');
    setCustomerPhone(cust.phone || '');
    setCustomerEmail(cust.email || '');
    setCustomerSearch('');
    setCustomerResults([]);
  };

  // ──────────────────────────────────────────────────────────────
  // AUTHORITATIVE BACKEND BILL CALCULATION
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cartItems.length === 0) {
      setCalculation({
        subtotal: 0,
        discountAmount: 0,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTaxAmount: 0,
        grandTotal: 0,
        isInterState: false,
      });
      setAmountReceived(0);
      return;
    }

    const calculate = async () => {
      try {
        const payload = {
          items: cartItems.map(i => ({
            productId: Number(i.productId),
            variantId: i.variantId ? Number(i.variantId) : undefined,
            quantity: i.quantity,
          })),
          discountType,
          discountValue: Number(discountValue) || 0,
          customerState,
        };

        const res: any = await adminApi.post('/spot-bills/calculate', payload);
        const data = res?.data || res;
        const total = typeof data?.grandTotal === 'number' ? data.grandTotal : (typeof data?.totalAmount === 'number' ? data.totalAmount : null);
        if (data && total !== null) {
          setCalculation({
            ...data,
            grandTotal: total,
            isInterState: data.supplyType === 'INTER_STATE' || Boolean(data.isInterState),
          });
          // Automatically fill exact amount received for Cash, while allowing cashier to modify anytime
          if (paymentMethod === 'CASH') {
            setAmountReceived(total);
          }
        }
      } catch (err: any) {
        console.error('Calculation error:', err);
      }
    };

    calculate();
  }, [cartItems, discountType, discountValue, customerState, paymentMethod]);

  // ──────────────────────────────────────────────────────────────
  // GENERATE BILL (ATOMIC TRANSACTION)
  // ──────────────────────────────────────────────────────────────
  const handleGenerateBill = async () => {
    if (cartItems.length === 0) {
      setBillError('Please add at least one product to the bill.');
      return;
    }

    if (paymentMethod === 'CASH' && amountReceived < calculation.grandTotal) {
      setBillError(`Insufficient payment: ₹${amountReceived} received but total is ₹${calculation.grandTotal}.`);
      return;
    }

    try {
      setIsSubmittingBill(true);
      setBillError('');

      const payload = {
        customerId: selectedCustomer?.id || undefined,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        customerState: customerState.trim() || 'Tamil Nadu',
        notes: customerNotes.trim() || undefined,
        discountType,
        discountValue: Number(discountValue) || 0,
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? Number(amountReceived) : calculation.grandTotal,
        paymentReference: paymentMethod === 'UPI' ? upiReference : (paymentMethod === 'CARD' ? cardReference : undefined),
        items: cartItems.map(i => ({
          productId: Number(i.productId),
          variantId: i.variantId ? Number(i.variantId) : undefined,
          quantity: i.quantity,
        })),
      };

      const res: any = await adminApi.post('/spot-bills', payload);
      const createdBill = res?.data || res;
      setCompletedBill(createdBill);

      // Auto-open print invoice modal for convenience
      setInvoiceModalBill(createdBill);

      // Refresh live history and reports data
      fetchBillingHistory();
      fetchReports();
    } catch (err: any) {
      console.error('Failed to generate spot bill:', err);
      const message = err?.response?.data?.message || err?.message || 'Failed to complete spot bill.';
      setBillError(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // TAB 2: FETCH BILLING HISTORY
  // ──────────────────────────────────────────────────────────────
  const fetchBillingHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(historyPage));
      params.append('limit', String(historyLimit));
      if (debouncedHistorySearch) params.append('search', debouncedHistorySearch);
      if (historyStatusFilter !== 'ALL') params.append('billStatus', historyStatusFilter);
      if (historyPaymentFilter !== 'ALL') params.append('paymentMethod', historyPaymentFilter);
      if (historyStartDate) params.append('startDate', historyStartDate);
      if (historyEndDate) params.append('endDate', historyEndDate);

      const res: any = await adminApi.get(`/spot-bills?${params.toString()}`);
      const rawData = res?.data || res;
      const billList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
          ? rawData.items
          : Array.isArray(res?.items)
            ? res.items
            : [];
      setHistoryBills(billList);
      const pag = rawData?.pagination || res?.pagination || (typeof rawData?.total === 'number' ? rawData : null);
      if (pag) {
        setHistoryPagination({
          page: pag.page || 1,
          limit: pag.limit || 20,
          total: pag.total || 0,
          totalPages: pag.totalPages || Math.ceil((pag.total || 0) / (pag.limit || 20)),
          hasNextPage: Boolean(pag.hasNextPage),
          hasPreviousPage: Boolean(pag.hasPreviousPage),
        });
      }
    } catch (err) {
      console.error('Failed to fetch billing history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'HISTORY' || activeTab === 'INVOICES') {
      fetchBillingHistory();
    }
  }, [
    activeTab,
    historyPage,
    historyLimit,
    debouncedHistorySearch,
    historyStatusFilter,
    historyPaymentFilter,
    historyStartDate,
    historyEndDate,
  ]);

  // Handle Bill Cancellation
  const handleConfirmCancel = async () => {
    if (!billToCancel) return;
    try {
      setIsCancelling(true);
      await adminApi.post(`/spot-bills/${billToCancel.id}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by staff at POS counter',
      });
      setCancelModalOpen(false);
      setBillToCancel(null);
      setCancelReason('');
      fetchBillingHistory();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel spot bill.');
    } finally {
      setIsCancelling(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // TAB 4: RETURNS & REFUNDS FLOW
  // ──────────────────────────────────────────────────────────────
  const handleFindBillForReturn = async (billNumOrId: string) => {
    if (!billNumOrId.trim()) return;
    try {
      setIsProcessingReturn(true);
      setReturnSuccessMsg('');
      const res: any = await adminApi.get(`/spot-bills?search=${encodeURIComponent(billNumOrId.trim())}&limit=1`);
      const items = res?.data || [];
      if (items.length > 0) {
        const fullBillRes: any = await adminApi.get(`/spot-bills/${items[0].id}`);
        const b = fullBillRes?.data || fullBillRes;
        setReturnSelectedBill(b);

        // Reset return items mapping
        const initQty: Record<string, number> = {};
        b.items.forEach((it: any) => {
          initQty[it.id] = 0;
        });
        setReturnItemsState(initQty);
      } else {
        alert('No spot bill found matching that number.');
      }
    } catch (err) {
      console.error('Find bill error:', err);
      alert('Could not find bill.');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleExecuteReturn = async () => {
    if (!returnSelectedBill) return;

    // Build return items array with numeric spotBillItemId and quantity
    const returnItemsPayload = Object.entries(returnItemsState)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([spotBillItemId, quantity]) => ({
        spotBillItemId: Number(spotBillItemId),
        quantity: Number(quantity),
      }));

    if (returnItemsPayload.length === 0) {
      alert('Please specify a return quantity of at least 1 item.');
      return;
    }

    try {
      setIsProcessingReturn(true);
      const payload = {
        reason: returnReason.trim() || 'Customer Return at counter',
        refundMethod: returnRefundMethod,
        items: returnItemsPayload,
      };

      const res: any = await adminApi.post(`/spot-bills/${returnSelectedBill.id}/return`, payload);
      setReturnSuccessMsg(`Return processed successfully! Refund Amount: ₹${res?.data?.refundAmount || res?.refundAmount || ''}`);
      // Refresh bill details
      const fullBillRes: any = await adminApi.get(`/spot-bills/${returnSelectedBill.id}`);
      setReturnSelectedBill(fullBillRes?.data || fullBillRes);
      setReturnItemsState({});
      setReturnReason('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to process return.');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // TAB 5: REPORTS FLOW
  // ──────────────────────────────────────────────────────────────
  const fetchReports = async () => {
    try {
      setReportLoading(true);
      let start = '';
      let end = '';

      const today = new Date();
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (reportDateRange === 'TODAY') {
        start = formatDate(today);
        end = formatDate(today);
      } else if (reportDateRange === 'YESTERDAY') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        start = formatDate(y);
        end = formatDate(y);
      } else if (reportDateRange === 'WEEK') {
        const w = new Date();
        w.setDate(w.getDate() - 7);
        start = formatDate(w);
        end = formatDate(today);
      } else if (reportDateRange === 'MONTH') {
        const m = new Date();
        m.setDate(m.getDate() - 30);
        start = formatDate(m);
        end = formatDate(today);
      } else if (reportDateRange === 'CUSTOM') {
        start = reportStartDate;
        end = reportEndDate;
      }

      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const res: any = await adminApi.get(`/spot-bills/reports/summary?${params.toString()}`);
      setReportData(res?.data || res);
    } catch (err) {
      console.error('Failed to fetch spot reports:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'REPORTS') {
      fetchReports();
    }
  }, [activeTab, reportDateRange, reportStartDate, reportEndDate]);

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '85vh' }}>
      {/* ──────────────────────────────────────────────────────────────
          HEADER & SUB-NAV TABS
          ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'linear-gradient(135deg, var(--green-900) 0%, #163e2c 100%)',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(13, 32, 22, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, fontFamily: 'var(--font-heading)', letterSpacing: '0.02em', margin: 0, color: '#ffffff' }}>
                Spot Billing & Counter POS
              </h1>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                }}
              >
                Retail Counter
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.2rem' }}>
              Direct walk-in billing, barcode scanning, live GST calculation, instant invoices & inventory deduction
            </p>
          </div>
        </div>

        {/* Quick Action: Start New Bill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => {
              if (activeTab !== 'NEW_BILL') {
                handleTabChange('NEW_BILL');
              } else {
                handleClearCart(true);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ffffff',
              color: 'var(--green-900)',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '0.6rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} />
            <span>New Bill</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────
          NAV TABS (New Bill, History, Invoices, Returns, Reports)
          ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid rgba(0,0,0,0.06)',
          paddingBottom: '0.5rem',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'NEW_BILL', label: 'New Bill (POS)', icon: Store },
          { id: 'HISTORY', label: 'Billing History', icon: Clock },
          { id: 'INVOICES', label: 'Tax Invoices', icon: FileText },
          { id: 'RETURNS', label: 'Returns & Refunds', icon: RotateCcw },
          { id: 'REPORTS', label: 'Sales Reports', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.1rem',
                borderRadius: '0.6rem',
                fontSize: '0.86rem',
                fontWeight: isActive ? 800 : 600,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--green-900)' : 'rgba(255, 255, 255, 0.7)',
                color: isActive ? '#ffffff' : 'var(--text-main)',
                boxShadow: isActive ? '0 4px 12px rgba(13, 32, 22, 0.2)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'NEW_BILL' && cartItems.length > 0 && (
                <span
                  style={{
                    background: '#e11d48',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '0.1rem 0.45rem',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                  }}
                >
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────────
          TAB 1: NEW BILL (THE POS REGISTER)
          ────────────────────────────────────────────────────────────── */}
      {activeTab === 'NEW_BILL' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Bill Completion Banner */}
          {completedBill && (
            <div
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                padding: '1.25rem 1.5rem',
                borderRadius: '0.85rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: '0 8px 20px rgba(5, 150, 105, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
                    Bill Completed Successfully!
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9, marginTop: '0.2rem' }}>
                    Bill #{completedBill.billNumber} • Total: ₹{completedBill.totalAmount.toLocaleString('en-IN')} • Payment: {completedBill.paymentMethod} (PAID)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  onClick={() => setInvoiceModalBill(completedBill)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#ffffff',
                    color: '#047857',
                    border: 'none',
                    padding: '0.55rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={15} />
                  <span>Print Tax Invoice</span>
                </button>
                <button
                  onClick={() => handleClearCart(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    padding: '0.55rem 1rem',
                    borderRadius: '0.5rem',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  <span>Start Next Bill</span>
                </button>
              </div>
            </div>
          )}

          {/* Barcode & Search Bar */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.85rem',
              padding: '1rem 1.25rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div ref={searchContainerRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: 'var(--green-50)',
                    color: 'var(--green-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Barcode size={22} />
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Scan USB barcode or search product by name, SKU, code, brand... (Press Enter on Scan)"
                    value={productSearch}
                    onChange={e => {
                      setProductSearch(e.target.value);
                      setShowSearchResults(true);
                    }}
                    onKeyDown={handleBarcodeKeyDown}
                    style={{
                      width: '100%',
                      padding: '0.75rem 2.5rem 0.75rem 1rem',
                      borderRadius: '0.6rem',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'var(--green-700)';
                      if (searchResults.length > 0) setShowSearchResults(true);
                    }}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
                  />
                  {productSearch && (
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* Quick View Bill Button (Always visible beside search when cart has items) */}
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchResults(false);
                      const el = document.getElementById('pos-cart-items-card');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '0.6rem',
                      border: '1.5px solid var(--green-600)',
                      background: 'var(--green-50)',
                      color: 'var(--green-950)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <ShoppingCart size={16} style={{ color: 'var(--green-800)' }} />
                    <span>View Bill ({cartItems.length}) • ₹{calculation.grandTotal.toLocaleString('en-IN')}</span>
                  </button>
                )}
              </div>

              {/* Live Search Results Dropdown (Controlled via showSearchResults so bill is never blocked) */}
              {searchResults.length > 0 && showSearchResults && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    borderRadius: '0.75rem',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                    border: '1.5px solid var(--green-600)',
                    zIndex: 100,
                    maxHeight: '19rem',
                    overflowY: 'auto',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Dropdown Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '0.75rem 0.75rem 0 0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green-900)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Matching Products ({searchResults.length})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSearchResults(false);
                          const el = document.getElementById('pos-cart-items-card');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '0.35rem',
                          background: 'var(--green-900)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <ShoppingCart size={13} />
                        <span>View Bill ({cartItems.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSearchResults(false)}
                        title="Close Dropdown"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Products List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.5rem', overflowY: 'auto', flex: 1 }}>
                    {searchResults.map(product => {
                      const variants = product.variants || [];
                      return (
                        <div
                          key={product.id}
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '0.55rem',
                            background: 'var(--bg-main)',
                            border: '1px solid rgba(0,0,0,0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '2.75rem',
                                height: '2.75rem',
                                borderRadius: '0.45rem',
                                background: '#ffffff',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {product.imageUrl || product.images?.[0]?.url ? (
                                <img
                                  src={product.imageUrl || product.images[0].url}
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <Tag size={18} style={{ color: 'var(--text-muted)' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                                {product.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem', marginTop: '0.1rem' }}>
                                {product.brand?.name && <span>Brand: {product.brand.name}</span>}
                                {product.productCode && <span>Code: {product.productCode}</span>}
                                <span>GST: {product.effectiveGstRate ?? product.gstRate ?? 5}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Variants list with quick add / active in-cart stepper */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {variants.length > 0 ? (
                              variants.map((v: any) => {
                                const outOfStock = v.stockQuantity <= 0;
                                const { index: cartIdx, quantity: inCartQty } = getCartItemInfo(product.id, v.id);
                                const label = formatVariantLabel(v);
                                const price = extractUnitPrice(v);

                                if (inCartQty > 0) {
                                  return (
                                    <div
                                      key={v.id}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        borderRadius: '0.45rem',
                                        border: '1.5px solid var(--green-600)',
                                        background: 'var(--green-50)',
                                        boxShadow: '0 1px 4px rgba(22, 101, 52, 0.12)',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <div style={{ padding: '0.35rem 0.55rem', fontSize: '0.76rem', fontWeight: 800, color: 'var(--green-950)' }}>
                                        <span>{label}</span>
                                        <span style={{ marginLeft: '0.35rem', color: 'var(--green-800)' }}>₹{price}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderLeft: '1px solid var(--green-200)' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCartQuantity(cartIdx, inCartQty - 1);
                                          }}
                                          title={inCartQty === 1 ? 'Remove from bill' : 'Decrease quantity'}
                                          style={{
                                            width: '1.85rem',
                                            height: '1.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: inCartQty === 1 ? '#fee2e2' : 'transparent',
                                            color: inCartQty === 1 ? '#dc2626' : 'var(--green-900)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease',
                                          }}
                                        >
                                          {inCartQty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                                        </button>
                                        <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 900, fontSize: '0.82rem', color: 'var(--green-950)' }}>
                                          {inCartQty}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCartQuantity(cartIdx, inCartQty + 1);
                                          }}
                                          disabled={inCartQty >= v.stockQuantity}
                                          title={inCartQty >= v.stockQuantity ? 'Maximum stock reached' : 'Add one more'}
                                          style={{
                                            width: '1.85rem',
                                            height: '1.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'transparent',
                                            color: inCartQty >= v.stockQuantity ? '#94a3b8' : 'var(--green-900)',
                                            border: 'none',
                                            cursor: inCartQty >= v.stockQuantity ? 'not-allowed' : 'pointer',
                                          }}
                                        >
                                          <Plus size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => {
                                      addProductToCart(product, v);
                                    }}
                                    disabled={outOfStock}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.45rem 0.75rem',
                                      borderRadius: '0.45rem',
                                      border: outOfStock ? '1px dashed #cbd5e1' : '1px solid var(--green-600)',
                                      background: outOfStock ? '#f1f5f9' : '#ffffff',
                                      color: outOfStock ? '#94a3b8' : 'var(--green-900)',
                                      cursor: outOfStock ? 'not-allowed' : 'pointer',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <span>{label}</span>
                                    <span style={{ color: 'var(--olive)', fontWeight: 800 }}>₹{price}</span>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '0.25rem',
                                        background: outOfStock ? '#fee2e2' : '#dcfce7',
                                        color: outOfStock ? '#b91c1c' : '#15803d',
                                      }}
                                    >
                                      {outOfStock ? 'OOS' : `Stock: ${v.stockQuantity}`}
                                    </span>
                                    <Plus size={14} />
                                  </button>
                                );
                              })
                            ) : (
                              (() => {
                                const { index: cartIdx, quantity: inCartQty } = getCartItemInfo(product.id);
                                const basePrice = Number(product.basePrice ?? product.price ?? 0);

                                if (inCartQty > 0) {
                                  return (
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        borderRadius: '0.45rem',
                                        border: '1.5px solid var(--green-600)',
                                        background: 'var(--green-50)',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <div style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--green-950)' }}>
                                        <span>Standard • ₹{basePrice}</span>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', borderLeft: '1px solid var(--green-200)' }}>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCartQuantity(cartIdx, inCartQty - 1);
                                          }}
                                          style={{
                                            width: '1.85rem',
                                            height: '1.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: inCartQty === 1 ? '#fee2e2' : 'transparent',
                                            color: inCartQty === 1 ? '#dc2626' : 'var(--green-900)',
                                            border: 'none',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          {inCartQty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                                        </button>
                                        <span style={{ minWidth: '1.5rem', textAlign: 'center', fontWeight: 900, fontSize: '0.82rem', color: 'var(--green-950)' }}>
                                          {inCartQty}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateCartQuantity(cartIdx, inCartQty + 1);
                                          }}
                                          style={{
                                            width: '1.85rem',
                                            height: '1.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'transparent',
                                            color: 'var(--green-900)',
                                            border: 'none',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          <Plus size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    type="button"
                                    onClick={() => addProductToCart(product)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                      padding: '0.45rem 0.75rem',
                                      borderRadius: '0.45rem',
                                      border: '1px solid var(--green-600)',
                                      background: 'var(--green-800)',
                                      color: '#ffffff',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    <span>₹{basePrice}</span>
                                    <Plus size={14} />
                                  </button>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dropdown Sticky Footer with Cart Summary & Done Button */}
                  <div style={{ position: 'sticky', bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '0 0 0.75rem 0.75rem', boxShadow: '0 -2px 10px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {cartItems.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>Select products above to add to bill</span>
                      ) : (
                        <span>
                          Bill Cart: <strong style={{ color: 'var(--green-900)' }}>{cartItems.length} items ({cartItems.reduce((s, i) => s + i.quantity, 0)} pcs)</strong> • Grand Total: <strong style={{ color: 'var(--green-900)', fontSize: '0.94rem' }}>₹{calculation.grandTotal.toLocaleString('en-IN')}</strong>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSearchResults(false);
                        const el = document.getElementById('pos-cart-items-card');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '0.45rem',
                        background: 'var(--green-900)',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Done & View Bill</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {billError && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={16} />
                <span>{billError}</span>
              </div>
            )}
          </div>

          {/* POS Sequential Workflow: Column-wise Flow
              1. Product Selection & Current Bill Items
              2. Customer Details & Bill Discount
              3. Payment Method & Complete Sale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>

            {/* ══════════════════════════════════════════════════
                STEP 1: CURRENT BILL ITEMS & CALCULATION BREAKDOWN
                ══════════════════════════════════════════════════ */}
            <div
              id="pos-cart-items-card"
              style={{
                background: '#ffffff',
                borderRadius: '0.85rem',
                padding: '1.25rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={18} style={{ color: 'var(--green-800)' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Current Bill Items</h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'var(--green-50)', color: 'var(--green-800)' }}>
                    {cartItems.length} items
                  </span>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={() => handleClearCart(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Empty State */}
              {cartItems.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    background: 'var(--bg-main)',
                    borderRadius: '0.75rem',
                    border: '1.5px dashed var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      width: '3.5rem',
                      height: '3.5rem',
                      borderRadius: '50%',
                      background: 'rgba(26, 61, 43, 0.08)',
                      color: 'var(--green-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1rem',
                    }}
                  >
                    <Barcode size={26} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--green-900)' }}>
                    Start a New Bill
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Search for a product above or scan a barcode to add items to this counter sale.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '20rem', overflowY: 'auto' }}>
                  {cartItems.map((item, idx) => {
                    const lineTotal = item.unitPrice * item.quantity;
                    return (
                      <div
                        key={`${item.productId}-${item.variantId || 'base'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '0.55rem',
                          background: 'var(--bg-main)',
                          border: '1px solid rgba(0,0,0,0.04)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '0.4rem',
                              background: '#ffffff',
                              border: '1px solid var(--border-color)',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {item.image ? (
                              <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Tag size={15} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.productName}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              {item.variantLabel && (
                                <span style={{ fontWeight: 700, color: 'var(--green-800)', background: 'var(--green-50)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                  {item.variantLabel}
                                </span>
                              )}
                              <span>• Unit: ₹{item.unitPrice.toLocaleString('en-IN')}</span>
                              <span>• Stock: {item.stockQuantity}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stepper Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0.75rem' }}>
                          <button
                            onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                            style={{
                              width: '1.75rem',
                              height: '1.75rem',
                              borderRadius: '0.35rem',
                              border: '1px solid var(--border-color)',
                              background: '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Minus size={13} />
                          </button>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '1.5rem', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                            disabled={item.quantity >= item.stockQuantity}
                            style={{
                              width: '1.75rem',
                              height: '1.75rem',
                              borderRadius: '0.35rem',
                              border: '1px solid var(--border-color)',
                              background: item.quantity >= item.stockQuantity ? '#f1f5f9' : '#ffffff',
                              color: item.quantity >= item.stockQuantity ? '#94a3b8' : 'var(--text-main)',
                              cursor: item.quantity >= item.stockQuantity ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        {/* Line Total & Remove */}
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div>
                            <div style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {item.quantity > 1 ? `(₹${item.unitPrice.toLocaleString('en-IN')} × ${item.quantity}) • ` : ''}GST {item.gstRate}%
                            </div>
                          </div>
                          <button
                            onClick={() => removeCartItem(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#e11d48',
                              cursor: 'pointer',
                              padding: '0.2rem',
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bill Breakdown Summary (from Authoritative Backend) */}
              {cartItems.length > 0 && (
                <div
                  style={{
                    marginTop: '1rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px dashed var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Subtotal (MRP inclusive)</span>
                    <span style={{ fontWeight: 700 }}>₹{calculation.subtotal.toFixed(2)}</span>
                  </div>

                  {calculation.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)' }}>
                      <span>Discount Applied</span>
                      <span style={{ fontWeight: 700 }}>-₹{calculation.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Taxable Amount</span>
                    <span style={{ fontWeight: 700 }}>₹{calculation.taxableAmount.toFixed(2)}</span>
                  </div>

                  {!calculation.isInterState ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>CGST (Intra-state TN)</span>
                        <span style={{ fontWeight: 700 }}>₹{calculation.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>SGST (Intra-state TN)</span>
                        <span style={{ fontWeight: 700 }}>₹{calculation.sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>IGST (Inter-state)</span>
                      <span style={{ fontWeight: 700 }}>₹{calculation.igstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '0.5rem',
                      paddingTop: '0.65rem',
                      borderTop: '2px solid var(--green-900)',
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: 'var(--green-900)',
                    }}
                  >
                    <span>Grand Total</span>
                    <span>₹{calculation.grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════
                STEP 2: CUSTOMER DETAILS & BILL DISCOUNT
                ══════════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {/* Customer Selector Card */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '0.85rem',
                  padding: '1.25rem',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} style={{ color: 'var(--green-800)' }} />
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Customer Details</h3>
                  </div>

                  {/* Mode Toggle */}
                  <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '0.5rem', padding: '0.2rem' }}>
                    <button
                      onClick={() => {
                        setCustomerMode('WALK_IN');
                        setSelectedCustomer(null);
                        setCustomerName('Walk-in Customer');
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: customerMode === 'WALK_IN' ? 'var(--green-900)' : 'transparent',
                        color: customerMode === 'WALK_IN' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      Walk-in
                    </button>
                    <button
                      onClick={() => setCustomerMode('REGISTERED')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: customerMode === 'REGISTERED' ? 'var(--green-900)' : 'transparent',
                        color: customerMode === 'REGISTERED' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      Select Customer
                    </button>
                  </div>
                </div>

                {customerMode === 'REGISTERED' && (
                  <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search existing customer by name, phone, email..."
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Customer Dropdown */}
                    {customerResults.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 0.35rem)',
                          left: 0,
                          right: 0,
                          background: '#ffffff',
                          borderRadius: '0.5rem',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          border: '1px solid var(--border-color)',
                          zIndex: 50,
                          maxHeight: '14rem',
                          overflowY: 'auto',
                          padding: '0.35rem',
                        }}
                      >
                        {customerResults.map(cust => (
                          <div
                            key={cust.id}
                            onClick={() => handleSelectCustomer(cust)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: '0.4rem',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.82rem',
                              borderBottom: '1px solid #f1f5f9',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div>
                              <div style={{ fontWeight: 700 }}>{cust.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {cust.phone || cust.email} • {cust.customerCode}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--green-700)', fontWeight: 700 }}>Select</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedCustomer && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '0.5rem',
                          background: 'var(--green-50)',
                          border: '1px solid var(--green-100)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--green-900)' }}>
                            {selectedCustomer.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--green-700)' }}>
                            {selectedCustomer.phone} • {selectedCustomer.email}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerName('Walk-in Customer');
                            setCustomerPhone('');
                            setCustomerEmail('');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e11d48',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Phone (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Supply / Customer State
                    </label>
                    <select
                      value={customerState}
                      onChange={e => setCustomerState(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.82rem',
                        background: '#ffffff',
                      }}
                    >
                      <option value="Tamil Nadu">Tamil Nadu (33 - CGST+SGST)</option>
                      <option value="Kerala">Kerala (32 - IGST)</option>
                      <option value="Karnataka">Karnataka (29 - IGST)</option>
                      <option value="Andhra Pradesh">Andhra Pradesh (37 - IGST)</option>
                      <option value="Telangana">Telangana (36 - IGST)</option>
                      <option value="Maharashtra">Maharashtra (27 - IGST)</option>
                      <option value="Puducherry">Puducherry (34 - IGST)</option>
                      <option value="Other">Other State (IGST)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="33AAAAA0000A1Z5"
                      value={customerGstin}
                      onChange={e => setCustomerGstin(e.target.value.toUpperCase())}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Controlled Discount Card */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '0.85rem',
                  padding: '1.25rem',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={18} style={{ color: 'var(--olive)' }} />
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Bill Discount</h3>
                  </div>
                  <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '0.45rem', padding: '0.15rem' }}>
                    <button
                      onClick={() => setDiscountType('FIXED')}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: discountType === 'FIXED' ? 'var(--green-900)' : 'transparent',
                        color: discountType === 'FIXED' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      ₹ Fixed
                    </button>
                    <button
                      onClick={() => setDiscountType('PERCENTAGE')}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: discountType === 'PERCENTAGE' ? 'var(--green-900)' : 'transparent',
                        color: discountType === 'PERCENTAGE' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      % Percent
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      min="0"
                      step={discountType === 'FIXED' ? '1' : '0.5'}
                      placeholder={discountType === 'FIXED' ? 'Enter discount in ₹' : 'Enter discount percentage %'}
                      value={discountValue || ''}
                      onChange={e => setDiscountValue(Math.max(0, Number(e.target.value)))}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  {calculation.discountAmount > 0 && (
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      -₹{calculation.discountAmount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════
                STEP 3: COUNTER PAYMENT METHOD & COMPLETE SALE
                ══════════════════════════════════════════════════ */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '0.85rem',
                padding: '1.25rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.98rem', fontWeight: 800 }}>
                Select Counter Payment Method
              </h4>

              {/* Payment Method Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'UPI', label: 'UPI QR', icon: QrCode },
                  { id: 'CARD', label: 'Card POS', icon: CreditCard },
                ].map(pm => {
                  const Icon = pm.icon;
                  const isSel = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => {
                        setPaymentMethod(pm.id as any);
                        if (pm.id === 'CASH') {
                          setAmountReceived(calculation.grandTotal);
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.75rem 0.5rem',
                        borderRadius: '0.55rem',
                        border: isSel ? '2px solid var(--green-800)' : '1px solid var(--border-color)',
                        background: isSel ? 'var(--green-50)' : '#ffffff',
                        color: isSel ? 'var(--green-900)' : 'var(--text-muted)',
                        fontWeight: isSel ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={20} />
                      <span style={{ fontSize: '0.82rem' }}>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash Flow Details */}
              {paymentMethod === 'CASH' && (
                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: '0.6rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Cash Received (₹)
                    </label>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: (amountReceived || calculation.grandTotal) >= calculation.grandTotal ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {(amountReceived || calculation.grandTotal) >= calculation.grandTotal
                        ? `Change: ₹${Math.max(0, (amountReceived || calculation.grandTotal) - calculation.grandTotal).toLocaleString('en-IN')}`
                        : `Pending: ₹${(calculation.grandTotal - (amountReceived || 0)).toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <input
                    type="number"
                    min={calculation.grandTotal}
                    value={amountReceived !== undefined && amountReceived !== null && amountReceived !== 0 ? amountReceived : (calculation.grandTotal || '')}
                    onChange={e => setAmountReceived(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.5rem',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      marginBottom: '0.5rem',
                    }}
                  />

                  {/* Quick Cash Suggestions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <button
                      onClick={() => setAmountReceived(calculation.grandTotal)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.35rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#ffffff',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                      }}
                    >
                      Exact ₹{calculation.grandTotal}
                    </button>
                    {[100, 200, 500, 1000, 2000]
                      .filter(val => val >= calculation.grandTotal)
                      .map(denom => (
                        <button
                          key={denom}
                          onClick={() => setAmountReceived(denom)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.35rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                          }}
                        >
                          ₹{denom}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* UPI Reference */}
              {paymentMethod === 'UPI' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    UPI Reference / Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN123456789 or UTR"
                    value={upiReference}
                    onChange={e => setUpiReference(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              )}

              {/* Card Reference */}
              {paymentMethod === 'CARD' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Card Terminal Slip / Reference # (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Slip # or Card last 4"
                    value={cardReference}
                    onChange={e => setCardReference(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              )}

              {/* Generate Bill Button */}
              <button
                onClick={handleGenerateBill}
                disabled={cartItems.length === 0 || isSubmittingBill || (paymentMethod === 'CASH' && (amountReceived || calculation.grandTotal) < calculation.grandTotal)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '0.65rem',
                  background: 'linear-gradient(135deg, var(--green-900) 0%, var(--green-800) 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.96rem',
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  cursor: (cartItems.length === 0 || isSubmittingBill || (paymentMethod === 'CASH' && (amountReceived || calculation.grandTotal) < calculation.grandTotal)) ? 'not-allowed' : 'pointer',
                  opacity: (cartItems.length === 0 || isSubmittingBill || (paymentMethod === 'CASH' && (amountReceived || calculation.grandTotal) < calculation.grandTotal)) ? 0.6 : 1,
                  boxShadow: '0 6px 18px rgba(13, 32, 22, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                }}
              >
                {isSubmittingBill ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Generating Bill & Deducting Stock...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Complete Sale & Generate Bill (₹{calculation.grandTotal.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          TAB 2: BILLING HISTORY
          ────────────────────────────────────────────────────────────── */}
      {activeTab === 'HISTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filters Bar */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.85rem',
              padding: '1rem 1.25rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem',
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by Bill #, Invoice #, customer, phone, cashier..."
                value={historySearch}
                onChange={e => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={historyPaymentFilter}
                onChange={e => {
                  setHistoryPaymentFilter(e.target.value);
                  setHistoryPage(1);
                }}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  background: '#ffffff',
                }}
              >
                <option value="ALL">All Payments</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
              </select>

              <select
                value={historyStatusFilter}
                onChange={e => {
                  setHistoryStatusFilter(e.target.value);
                  setHistoryPage(1);
                }}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  background: '#ffffff',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PARTIALLY_RETURNED">Partially Returned</option>
                <option value="FULLY_RETURNED">Fully Returned</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <input
                type="date"
                value={historyStartDate}
                onChange={e => {
                  setHistoryStartDate(e.target.value);
                  setHistoryPage(1);
                }}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                }}
              />

              <input
                type="date"
                value={historyEndDate}
                onChange={e => {
                  setHistoryEndDate(e.target.value);
                  setHistoryPage(1);
                }}
                style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                }}
              />
            </div>
          </div>

          {/* History Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.85rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              border: '1px solid var(--border-color)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Bill # / Invoice #</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Items</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Cashier</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                      <div>Loading billing records...</div>
                    </td>
                  </tr>
                ) : historyBills.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No spot bills found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  historyBills.map(b => (
                    <tr
                      key={b.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-main)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--green-900)' }}>{b.billNumber}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.invoiceNumber || '—'}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {new Date(b.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700 }}>{b.customerName || 'Walk-in Customer'}</div>
                        {b.customerPhone && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{b.customerPhone}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: 700 }}>{b.items?.length || 0} items</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 900, color: 'var(--text-main)' }}>
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Tax: ₹{Number(b.totalTaxAmount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.35rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: b.paymentMethod === 'CASH' ? '#ecfdf5' : (b.paymentMethod === 'UPI' ? '#eff6ff' : '#fdf4ff'),
                            color: b.paymentMethod === 'CASH' ? '#047857' : (b.paymentMethod === 'UPI' ? '#1d4ed8' : '#7e22ce'),
                          }}
                        >
                          {b.paymentMethod}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {b.cashier?.name || 'Staff'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background:
                              b.billStatus === 'COMPLETED'
                                ? '#dcfce7'
                                : b.billStatus === 'CANCELLED'
                                  ? '#fee2e2'
                                  : '#fef3c7',
                            color:
                              b.billStatus === 'COMPLETED'
                                ? '#15803d'
                                : b.billStatus === 'CANCELLED'
                                  ? '#b91c1c'
                                  : '#b45309',
                          }}
                        >
                          {b.billStatus}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => setInvoiceModalBill(b)}
                            title="View / Print Tax Invoice"
                            style={{
                              padding: '0.4rem 0.65rem',
                              borderRadius: '0.4rem',
                              border: '1px solid var(--border-color)',
                              background: '#ffffff',
                              color: 'var(--green-900)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            <Printer size={13} />
                            <span>Invoice</span>
                          </button>

                          {b.billStatus === 'COMPLETED' && (
                            <>
                              <button
                                onClick={() => {
                                  setReturnBillIdSearch(b.billNumber);
                                  handleFindBillForReturn(b.billNumber);
                                  handleTabChange('RETURNS');
                                }}
                                title="Process Return"
                                style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '0.4rem',
                                  border: '1px solid #fed7aa',
                                  background: '#fff7ed',
                                  color: '#c2410c',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                Return
                              </button>

                              <button
                                onClick={() => {
                                  setBillToCancel(b);
                                  setCancelModalOpen(true);
                                }}
                                title="Cancel Bill"
                                style={{
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '0.4rem',
                                  border: '1px solid #fecaca',
                                  background: '#fef2f2',
                                  color: '#b91c1c',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <Pagination
                pagination={historyPagination}
                onPageChange={setHistoryPage}
                onLimitChange={setHistoryLimit}
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          TAB 3: TAX INVOICES LIST
          ────────────────────────────────────────────────────────────── */}
      {activeTab === 'INVOICES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header & Search */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.85rem',
              padding: '1rem 1.25rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                Ayngaran Foods Counter Invoices
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official GST Tax Invoices for Counter Sales
              </p>
            </div>

            <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by Invoice #, Bill #, or Customer..."
                value={historySearch}
                onChange={e => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.85rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              border: '1px solid var(--border-color)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Invoice Number</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Bill Number</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Taxable Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Total Tax</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Total Amount</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                      <div>Loading tax invoices...</div>
                    </td>
                  </tr>
                ) : historyBills.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No spot bill tax invoices found. Generate a spot bill from the Register tab to create tax invoices.
                    </td>
                  </tr>
                ) : (
                  historyBills.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--green-900)' }}>
                        {b.invoiceNumber || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {b.billNumber}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {new Date(b.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {b.customerName || 'Walk-in'}
                        {b.customerPhone && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.customerPhone}</div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        ₹{Number(b.taxableAmount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--olive)', fontWeight: 700 }}>
                        ₹{Number(b.totalTaxAmount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 900 }}>
                        ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#047857' }}>
                          {b.paymentMethod} (PAID)
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setInvoiceModalBill(b)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: '0.4rem',
                            background: 'var(--green-900)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Printer size={13} />
                          <span>View / Print A4</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <Pagination
                pagination={historyPagination}
                onPageChange={setHistoryPage}
                onLimitChange={setHistoryLimit}
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          TAB 4: RETURNS & REFUNDS
          ────────────────────────────────────────────────────────────── */}
      {activeTab === 'RETURNS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Find Bill Box */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.85rem',
              padding: '1.25rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <RotateCcw size={18} style={{ color: 'var(--accent-amber)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Process Spot Bill Return & Refund</h3>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Returns restore inventory into the ledger with reason `SPOT_BILL_RETURN` and record auditable counter refund vouchers.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '500px' }}>
              <input
                type="text"
                placeholder="Enter Bill # (e.g. SB-2026-000001)"
                value={returnBillIdSearch}
                onChange={e => setReturnBillIdSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                }}
              />
              <button
                onClick={() => handleFindBillForReturn(returnBillIdSearch)}
                disabled={isProcessingReturn}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.5rem',
                  background: 'var(--green-900)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Find Bill
              </button>
            </div>

            {returnSuccessMsg && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#15803d',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {returnSuccessMsg}
              </div>
            )}
          </div>

          {/* Return Execution Panel */}
          {returnSelectedBill && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '0.85rem',
                padding: '1.25rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--green-900)' }}>
                    Bill #{returnSelectedBill.billNumber}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Customer: {returnSelectedBill.customerName} • Date: {new Date(returnSelectedBill.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: '#fef3c7',
                    color: '#b45309',
                  }}
                >
                  Status: {returnSelectedBill.billStatus}
                </span>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Product / Variant</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Billed Qty</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Prev. Returned</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Remaining</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Unit Price</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Return Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {returnSelectedBill.items?.map(it => {
                    const remaining = it.quantity - it.returnedQuantity;
                    return (
                      <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <div style={{ fontWeight: 800 }}>{it.productNameSnapshot}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {it.variantLabelSnapshot || it.skuSnapshot}
                          </div>
                        </td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>{it.quantity}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: 'var(--accent-amber)' }}>{it.returnedQuantity}</td>
                        <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800 }}>{remaining}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>₹{Number(it.unitPrice || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.65rem 0.75rem' }}>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={returnItemsState[it.id] || 0}
                            onChange={e => {
                              const val = Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0));
                              setReturnItemsState(prev => ({ ...prev, [it.id]: val }));
                            }}
                            disabled={remaining <= 0}
                            style={{
                              width: '5rem',
                              padding: '0.4rem 0.5rem',
                              borderRadius: '0.4rem',
                              border: '1px solid var(--border-color)',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Reason & Refund Method */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Reason for Return / Customer Feedback
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer returned damaged seal / wrong size"
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Refund Payout Method
                  </label>
                  <select
                    value={returnRefundMethod}
                    onChange={e => setReturnRefundMethod(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      background: '#ffffff',
                    }}
                  >
                    <option value="CASH">Cash Refund</option>
                    <option value="UPI">UPI Refund</option>
                    <option value="CARD">Card Reversal</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleExecuteReturn}
                disabled={isProcessingReturn}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: 'var(--green-900)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: isProcessingReturn ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>Confirm Return & Restore Stock</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          TAB 5: REPORTS & ANALYTICS
          ────────────────────────────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Date Range Selector */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '0.85rem',
              padding: '1rem 1.25rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--green-800)' }} />
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Reporting Period</h3>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map(preset => (
                <button
                  key={preset}
                  onClick={() => setReportDateRange(preset)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.45rem',
                    fontSize: '0.78rem',
                    fontWeight: reportDateRange === preset ? 800 : 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: reportDateRange === preset ? 'var(--green-900)' : 'var(--bg-main)',
                    color: reportDateRange === preset ? '#ffffff' : 'var(--text-main)',
                  }}
                >
                  {preset}
                </button>
              ))}

              {reportDateRange === 'CUSTOM' && (
                <>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={e => setReportStartDate(e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                  />
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={e => setReportEndDate(e.target.value)}
                    style={{ padding: '0.45rem 0.65rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Summary Metric Cards */}
          {reportLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', borderRadius: '0.85rem', border: '1px solid var(--border-color)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
              <div>Loading counter sales reports...</div>
            </div>
          ) : (() => {
            const summary = reportDateRange === 'TODAY'
              ? (reportData?.todaySummary || reportData?.rangeSummary)
              : (reportData?.rangeSummary || reportData?.todaySummary);

            if (!summary) {
              return (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: '#ffffff', borderRadius: '0.85rem', border: '1px solid var(--border-color)' }}>
                  No spot sales records found for this reporting period.
                </div>
              );
            }

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Total Bills', value: summary.totalBills || 0, prefix: '', color: 'var(--green-900)' },
                  { label: 'Gross Sales', value: Number(summary.grossSales || 0).toLocaleString('en-IN'), prefix: '₹', color: 'var(--green-800)' },
                  { label: 'Total Discount', value: Number(summary.totalDiscount || 0).toLocaleString('en-IN'), prefix: '₹', color: 'var(--accent-amber)' },
                  { label: 'Total Tax (GST)', value: Number(summary.totalTax || 0).toFixed(2), prefix: '₹', color: 'var(--olive)' },
                  { label: 'Returns', value: Number(summary.returns || 0).toLocaleString('en-IN'), prefix: '₹', color: '#e11d48' },
                  { label: 'Net Sales', value: Number(summary.netSales || 0).toLocaleString('en-IN'), prefix: '₹', color: '#059669' },
                ].map(card => (
                  <div
                    key={card.label}
                    style={{
                      background: '#ffffff',
                      borderRadius: '0.75rem',
                      padding: '1.15rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: card.color, marginTop: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                      {card.prefix}{card.value}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Payment Method Breakdown & Cashier Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Payment Method Report */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '0.85rem',
                padding: '1.25rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 800 }}>
                Payment Methods Distribution
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(Array.isArray(reportData?.paymentMethods) ? reportData.paymentMethods : []).map((pm: any) => (
                  <div
                    key={pm.method}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.55rem',
                      background: 'var(--bg-main)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{pm.method}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pm.count} transactions</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '0.98rem', color: 'var(--green-900)' }}>
                      ₹{pm.total.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cashier Report */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '0.85rem',
                padding: '1.25rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 800 }}>
                Cashier Counter Performance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(Array.isArray(reportData?.cashierReports) ? reportData.cashierReports : []).map((cr: any) => (
                  <div
                    key={cr.cashierId || cr.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.55rem',
                      background: 'var(--bg-main)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{cr.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cr.bills} bills generated</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: '0.98rem', color: 'var(--green-900)' }}>
                      ₹{cr.totalSales.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Products Table */}
          {Array.isArray(reportData?.topProducts) && reportData.topProducts.length > 0 && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '0.85rem',
                padding: '1.25rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                border: '1px solid var(--border-color)',
                overflowX: 'auto',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 800 }}>
                Top Selling Products at Counter
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Product Name</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>SKU</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Qty Sold</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topProducts.map((p: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700 }}>{p.productName}</td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{p.sku}</td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800 }}>{p.quantity}</td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 900, color: 'var(--green-900)' }}>
                        ₹{p.sales.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────
          INVOICE MODAL (A4 PRINT READY)
          ────────────────────────────────────────────────────────────── */}
      <SpotBillInvoiceModal
        isOpen={!!invoiceModalBill}
        onClose={() => setInvoiceModalBill(null)}
        bill={invoiceModalBill}
      />

      {/* ──────────────────────────────────────────────────────────────
          CANCELLATION CONFIRMATION MODAL
          ────────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Spot Bill"
        subtitle={`Bill #${billToCancel?.billNumber}`}
        maxWidth="30rem"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button
              onClick={() => setCancelModalOpen(false)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              Back
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '0.5rem',
                background: '#b91c1c',
                color: '#ffffff',
                border: 'none',
                cursor: isCancelling ? 'not-allowed' : 'pointer',
                fontWeight: 800,
                fontSize: '0.82rem',
              }}
            >
              {isCancelling ? 'Reversing Inventory...' : 'Confirm Cancellation'}
            </button>
          </div>
        }
      >
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
            Cancelling this spot bill will reverse the financial transaction and automatically restore all stock items to inventory with ledger reason <code style={{ background: '#f1f5f9', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>SPOT_BILL_CANCEL</code>.
          </p>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Reason for Cancellation:
          </label>
          <textarea
            rows={3}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="e.g. Customer cancelled order / payment issue at counter"
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </AdminModal>
    </div>
  );
};
