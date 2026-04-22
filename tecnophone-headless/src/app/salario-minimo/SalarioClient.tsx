'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp,
  ArrowRight,
  ShoppingCart,
  Calculator,
  Building2,
  Shield,
  Smartphone,
  DollarSign,
  Briefcase,
  Clock,
  CreditCard,
  Wallet,
  HelpCircle,
  ChevronDown,
  X,
  Tag,
  Sparkles,
} from 'lucide-react';

// ===== Official minimum wage data (Decreto del Gobierno Nacional — changes every Jan 1) =====
const SALARIO_DATA = [
  { year: 2026, salario: 1750905, auxTransporte: 249095, decreto: '1469 y 1470 de 2025' },
  { year: 2025, salario: 1423500, auxTransporte: 200000, decreto: '2292 de 2024' },
  { year: 2024, salario: 1300000, auxTransporte: 162000, decreto: '2292 de 2023' },
  { year: 2023, salario: 1160000, auxTransporte: 140606, decreto: '2613 de 2022' },
  { year: 2022, salario: 1000000, auxTransporte: 117172, decreto: '1724 de 2021' },
  { year: 2021, salario: 908526, auxTransporte: 106454, decreto: '1785 de 2020' },
  { year: 2020, salario: 877803, auxTransporte: 102854, decreto: '2360 de 2019' },
  { year: 2019, salario: 828116, auxTransporte: 97032, decreto: '2451 de 2018' },
  { year: 2018, salario: 781242, auxTransporte: 88211, decreto: '2269 de 2017' },
  { year: 2017, salario: 737717, auxTransporte: 83140, decreto: '2209 de 2016' },
  { year: 2016, salario: 689455, auxTransporte: 77700, decreto: '2552 de 2015' },
];

const CURRENT = SALARIO_DATA[0];
const PREVIOUS = SALARIO_DATA[1];
const INCREMENT = PREVIOUS.salario > 0 
  ? ((CURRENT.salario - PREVIOUS.salario) / PREVIOUS.salario * 100) 
  : 0;

// Deductions: employee pays 4% health + 4% pension = 8%
const DEDUCTION_RATE = 0.08;

interface Product {
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  images: { src: string }[];
  on_sale: boolean;
}

interface FaqItem { q: string; a: string; }

interface SalarioClientProps {
  products: Product[];
  faqItems?: FaqItem[];
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPrice(price: string) {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return formatCOP(num);
}

export default function SalarioClient({ products, faqItems = [] }: SalarioClientProps) {
  const [userSalary, setUserSalary] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Installment calculator (¿Cuántas cuotas?)
  const [productPrice, setProductPrice] = useState('');
  const [installmentMonths, setInstallmentMonths] = useState(12);

  // Budget filter (¿Te alcanza?)
  const [budget, setBudget] = useState('');

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Sticky CTA dismiss state
  const [stickyDismissed, setStickyDismissed] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalIngreso = CURRENT.salario + CURRENT.auxTransporte;
  const deduccion = Math.round(CURRENT.salario * DEDUCTION_RATE);
  const neto = totalIngreso - deduccion;
  const porDia = Math.round(CURRENT.salario / 30);
  const porHora = Math.round(CURRENT.salario / 240);

  // Calculator
  const userNum = parseFloat(userSalary.replace(/[.,]/g, ''));
  const salarioMinimos = !isNaN(userNum) ? userNum / CURRENT.salario : 0;
  const userDeduccion = !isNaN(userNum) ? Math.round(userNum * DEDUCTION_RATE) : 0;
  const userNeto = !isNaN(userNum) ? userNum - userDeduccion : 0;
  const userPorDia = !isNaN(userNum) ? Math.round(userNum / 30) : 0;
  const userPorHora = !isNaN(userNum) ? Math.round(userNum / 240) : 0;

  // Products by salary range
  const under1Salary = products.filter(p => parseFloat(p.price) <= CURRENT.salario);
  const under2Salary = products.filter(p => {
    const price = parseFloat(p.price);
    return price > CURRENT.salario && price <= CURRENT.salario * 2;
  });
  const allAffordable = products.filter(p => parseFloat(p.price) <= CURRENT.salario * 2);

  // ===== Cuotas products: priced 8–14 SMLV (~12 cuotas razonables) =====
  const cuotasProducts = useMemo(
    () => products
      .filter(p => {
        const price = parseFloat(p.price);
        return price >= CURRENT.salario * 0.5 && price <= CURRENT.salario * 14;
      })
      .slice(0, 6),
    [products],
  );

  // ===== Installment calculator =====
  const productPriceNum = parseFloat(productPrice.replace(/[.,]/g, '')) || 0;
  const monthlyPayment = productPriceNum > 0 ? Math.round(productPriceNum / installmentMonths) : 0;
  const monthlyAsPercentSalary = productPriceNum > 0 ? (monthlyPayment / CURRENT.salario) * 100 : 0;

  // ===== Cheapest installment for sticky CTA =====
  const cheapestProduct = products[0];
  const cheapestMonthly = cheapestProduct ? Math.round(parseFloat(cheapestProduct.price) / 12) : 0;

  // ===== Budget filter =====
  const budgetNum = parseFloat(budget.replace(/[.,]/g, '')) || 0;
  const budgetMatches = useMemo(
    () => budgetNum > 0
      ? products.filter(p => parseFloat(p.price) <= budgetNum).slice(0, 8)
      : [],
    [budget, budgetNum, products],
  );

  // ===== Categorías por presupuesto =====
  const categoriasPresupuesto = [
    { label: 'Audio y accesorios', max: Math.round(CURRENT.salario * 0.3), color: 'emerald', emoji: '🎧' },
    { label: 'Smartwatch / Tablets básicas', max: Math.round(CURRENT.salario * 0.7), color: 'blue', emoji: '⌚' },
    { label: 'Celulares gama media', max: CURRENT.salario, color: 'indigo', emoji: '📱' },
    { label: 'Laptops y celulares premium', max: Math.round(CURRENT.salario * 2), color: 'purple', emoji: '💻' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* === ANNOUNCEMENT BAR — visible inmediatamente === */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white text-xs sm:text-sm font-bold py-2 px-3 text-center">
        <Link href="/productos" className="inline-flex items-center gap-1.5 hover:underline">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Compra hoy con tu salario · Paga en cuotas con tu tarjeta de crédito</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative container-custom py-10 lg:py-16">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              <Briefcase className="w-4 h-4" />
              Dato oficial {CURRENT.year}
            </span>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 font-display mb-3">
              Salario Mínimo {CURRENT.year} en Colombia
            </h1>
            <p className="text-surface-600 text-lg max-w-2xl mx-auto">
              Salario Vital según Decretos {CURRENT.decreto} del Gobierno Nacional. Total mensual: <strong className="text-gray-900">{formatCOP(totalIngreso)}</strong>.
            </p>
          </div>

          {/* 3-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-center max-w-6xl mx-auto">
            {/* Left: Equípate */}
            <Link href="/productos" className="hidden lg:flex flex-col items-center text-center bg-white/80 backdrop-blur rounded-2xl border border-surface-200 hover:border-primary-300 hover:shadow-lg p-8 transition-all group">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                <Smartphone className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2">Equípate con tu salario</h3>
              <p className="text-sm text-surface-600 mb-4 leading-relaxed">
                Tecnología desde <span className="font-bold text-primary-600">menos de 1 SMLV</span>. Portátiles, celulares y más al mejor precio.
              </p>
              <div className="flex items-center gap-1 text-sm font-bold text-primary-600 group-hover:gap-2 transition-all">
                <ShoppingCart className="w-4 h-4" />
                Ver productos
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Center: Main card */}
            <div className="w-full lg:w-[440px]">
              <div className="bg-white rounded-2xl shadow-xl border border-surface-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <DollarSign className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase tracking-wider opacity-90">Salario Mínimo Mensual</span>
                  </div>
                  <div className="text-4xl lg:text-5xl font-extrabold tracking-tight">
                    {formatCOP(CURRENT.salario)}
                  </div>
                  <div className="text-sm opacity-80 mt-1">SMLV {CURRENT.year}</div>
                </div>

                <div className="p-5 space-y-3">
                  {/* Increment badge */}
                  {INCREMENT > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-sm font-bold">
                        <TrendingUp className="w-4 h-4" /> +{INCREMENT.toFixed(1)}% vs {PREVIOUS.year}
                      </span>
                      <span className="text-xs text-surface-500">+{formatCOP(CURRENT.salario - PREVIOUS.salario)}</span>
                    </div>
                  )}

                  {/* Breakdown */}
                  <div className="bg-surface-50 rounded-xl p-4 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-600">Salario base</span>
                      <span className="font-bold text-gray-900">{formatCOP(CURRENT.salario)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-600">Auxilio de transporte</span>
                      <span className="font-bold text-gray-900">+{formatCOP(CURRENT.auxTransporte)}</span>
                    </div>
                    <div className="border-t border-surface-200 pt-2 flex justify-between text-sm">
                      <span className="font-bold text-gray-900">Total devengado</span>
                      <span className="font-extrabold text-blue-600">{formatCOP(totalIngreso)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-500">Deducciones (salud + pensión 8%)</span>
                      <span className="font-bold text-red-500">-{formatCOP(deduccion)}</span>
                    </div>
                    <div className="border-t border-surface-200 pt-2 flex justify-between text-sm">
                      <span className="font-bold text-gray-900">Neto a recibir</span>
                      <span className="font-extrabold text-green-600">{formatCOP(neto)}</span>
                    </div>
                  </div>

                  {/* === CTA INTEGRADO: Cuotas desde tu salario === */}
                  {cheapestProduct && (
                    <Link
                      href="/productos"
                      className="block bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl p-3.5 text-white shadow-md hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider font-bold opacity-90 leading-none mb-0.5">Con tu salario puedes llevar</p>
                          <p className="text-sm font-extrabold leading-tight">Tecnología desde <span className="text-yellow-200">{formatCOP(cheapestMonthly)}/mes</span></p>
                          <p className="text-[10px] opacity-80">Paga cómodamente con tu tarjeta de crédito</p>
                        </div>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                    </Link>
                  )}

                  {/* Per day/hour */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                      <div className="text-xs text-blue-600 font-bold">Por día</div>
                      <div className="text-lg font-extrabold text-gray-900">{formatCOP(porDia)}</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-2.5 text-center">
                      <div className="text-xs text-indigo-600 font-bold">Por hora</div>
                      <div className="text-lg font-extrabold text-gray-900">{formatCOP(porHora)}</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-surface-400 mt-1">
                    Decreto {CURRENT.decreto} — Gobierno de Colombia
                  </div>
                </div>
              </div>
            </div>

            {/* Right: ¿Eres empresa? */}
            <Link href="/empresas" className="hidden lg:flex flex-col items-center text-center bg-white/80 backdrop-blur rounded-2xl border border-surface-200 hover:border-emerald-300 hover:shadow-lg p-8 transition-all group">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900 mb-2">¿Eres empresa?</h3>
              <p className="text-sm text-surface-600 mb-4 leading-relaxed">
                Equipa a tus empleados con <span className="font-bold text-emerald-600">precios corporativos</span>. Descuentos por volumen y factura DIAN.
              </p>
              <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 group-hover:gap-2 transition-all">
                <Shield className="w-4 h-4" />
                Cotizar ahora
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Mobile CTAs */}
            <div className="grid grid-cols-2 gap-3 lg:hidden col-span-full">
              <Link href="/productos" className="flex items-center gap-2 bg-primary-50 hover:bg-primary-100 rounded-xl p-3.5 transition-colors">
                <Smartphone className="w-5 h-5 text-primary-600 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-gray-900">Equípate</p>
                  <p className="text-[10px] text-surface-500">Desde &lt;1 SMLV</p>
                </div>
              </Link>
              <Link href="/empresas" className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl p-3.5 transition-colors">
                <Building2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-extrabold text-gray-900">¿Eres empresa?</p>
                  <p className="text-[10px] text-surface-500">Precios corporativos</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-10 lg:py-14 bg-white border-y border-surface-200">
        <div className="container-custom max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
              <Calculator className="w-4 h-4" />
              Calculadora
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">
              ¿Cuántos salarios mínimos ganas?
            </h2>
          </div>

          <div className="max-w-md mx-auto">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Tu salario mensual (COP)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="2.500.000"
                value={userSalary}
                onChange={(e) => {
                  setUserSalary(e.target.value);
                  setShowResults(e.target.value.length > 0);
                }}
                className="w-full pl-8 pr-4 py-3 border border-surface-300 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {showResults && salarioMinimos > 0 && (
              <div className="mt-4 bg-blue-50 rounded-xl p-5 space-y-3 animate-in fade-in">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-blue-600">{salarioMinimos.toFixed(1)}x</div>
                  <div className="text-sm text-surface-600">salarios mínimos</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2.5">
                    <div className="text-xs text-surface-500">Por día</div>
                    <div className="font-bold text-gray-900">{formatCOP(userPorDia)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <div className="text-xs text-surface-500">Por hora</div>
                    <div className="font-bold text-gray-900">{formatCOP(userPorHora)}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm border-t border-blue-100 pt-2">
                  <span className="text-surface-600">Deducciones (8%)</span>
                  <span className="font-bold text-red-500">-{formatCOP(userDeduccion)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-900">Neto estimado</span>
                  <span className="font-extrabold text-green-600">{formatCOP(userNeto)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Historical table */}
      <section className="py-10 lg:py-14 bg-surface-50">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 text-center mb-8">
            Salario Mínimo — Histórico Colombia
          </h2>
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200">
                    <th className="text-left font-bold text-gray-900 px-4 py-3">Año</th>
                    <th className="text-right font-bold text-gray-900 px-4 py-3">SMLV</th>
                    <th className="text-right font-bold text-gray-900 px-4 py-3">Aux. Transporte</th>
                    <th className="text-right font-bold text-gray-900 px-4 py-3">Total</th>
                    <th className="text-right font-bold text-gray-900 px-4 py-3">Incremento</th>
                  </tr>
                </thead>
                <tbody>
                  {SALARIO_DATA.map((row, i) => {
                    const prev = SALARIO_DATA[i + 1];
                    const inc = prev ? ((row.salario - prev.salario) / prev.salario * 100) : 0;
                    return (
                      <tr key={row.year} className={`border-b border-surface-100 ${i === 0 ? 'bg-blue-50/50 font-bold' : 'hover:bg-surface-50'}`}>
                        <td className="px-4 py-2.5 font-bold text-gray-900">
                          {row.year}
                          {i === 0 && <span className="ml-1.5 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">Vigente</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-900">{formatCOP(row.salario)}</td>
                        <td className="px-4 py-2.5 text-right text-surface-600">{formatCOP(row.auxTransporte)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-900">{formatCOP(row.salario + row.auxTransporte)}</td>
                        <td className="px-4 py-2.5 text-right">
                          {inc > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-green-600 font-bold text-xs">
                              <TrendingUp className="w-3 h-3" /> +{inc.toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Products by salary range */}
      {allAffordable.length > 0 && (
        <section className="py-12 lg:py-16 bg-white border-t border-surface-200">
          <div className="container-custom">
            <div className="text-center mb-10">
              <span className="inline-block bg-primary-50 text-primary-600 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                Poder adquisitivo
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
                ¿Qué tecnología puedes comprar con tu salario?
              </h2>
              <p className="text-surface-600 max-w-xl mx-auto">
                Productos disponibles por rango de salario mínimo. Todos con factura electrónica DIAN y garantía oficial.
              </p>
            </div>

            {/* Under 1 SMLV */}
            {under1Salary.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Menos de 1 SMLV</span>
                  Hasta {formatCOP(CURRENT.salario)}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {under1Salary.slice(0, 4).map((product) => (
                    <Link
                      key={product.slug}
                      href={`/producto/${product.slug}`}
                      className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-surface-50 p-3">
                        {product.images?.[0]?.src && (
                          <Image src={product.images[0].src} alt={product.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                        )}
                        {product.on_sale && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">OFERTA</span>}
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">{product.name}</h4>
                        <span className="text-base font-extrabold text-primary-600">{formatPrice(product.price)}</span>
                        <div className="text-xs text-surface-500">= {(parseFloat(product.price) / CURRENT.salario).toFixed(1)} SMLV</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 1-2 SMLV */}
            {under2Salary.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">1 a 2 SMLV</span>
                  {formatCOP(CURRENT.salario)} — {formatCOP(CURRENT.salario * 2)}
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {under2Salary.slice(0, 4).map((product) => (
                    <Link
                      key={product.slug}
                      href={`/producto/${product.slug}`}
                      className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300"
                    >
                      <div className="relative aspect-square bg-surface-50 p-3">
                        {product.images?.[0]?.src && (
                          <Image src={product.images[0].src} alt={product.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                        )}
                        {product.on_sale && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">OFERTA</span>}
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">{product.name}</h4>
                        <span className="text-base font-extrabold text-primary-600">{formatPrice(product.price)}</span>
                        <div className="text-xs text-surface-500">= {(parseFloat(product.price) / CURRENT.salario).toFixed(1)} SMLV</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Ver todos los productos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================== */}
      {/* === BANNER CUOTAS SIN INTERÉS                === */}
      {/* ============================================== */}
      {cuotasProducts.length > 0 && (
        <section className="py-10 lg:py-14 bg-gradient-to-br from-emerald-50 via-white to-blue-50 border-y border-emerald-100">
          <div className="container-custom">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                <CreditCard className="w-3.5 h-3.5" />
                12 CUOTAS SIN INTERÉS
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-2">
                Con tu salario mínimo accede a esta tecnología
              </h2>
              <p className="text-surface-600 text-sm lg:text-base max-w-2xl mx-auto">
                Paga cómodamente en cuotas mensuales con tu tarjeta de crédito · Pago seguro a través del checkout
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
              {cuotasProducts.map((p) => {
                const price = parseFloat(p.price);
                const monthly = Math.round(price / 12);
                return (
                  <Link
                    key={p.slug}
                    href={`/producto/${p.slug}`}
                    className="group bg-white rounded-xl border border-emerald-200 hover:border-emerald-400 hover:shadow-lg overflow-hidden transition-all"
                  >
                    <div className="relative aspect-square bg-surface-50">
                      {p.images?.[0]?.src && (
                        <Image
                          src={p.images[0].src}
                          alt={p.name}
                          fill
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 16vw"
                        />
                      )}
                      <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                        12 CUOTAS
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1.5 min-h-[2rem] group-hover:text-emerald-700 transition-colors">{p.name}</h4>
                      <div className="text-[10px] text-surface-500 line-through">{formatPrice(p.price)}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-emerald-600">{formatCOP(monthly)}</span>
                        <span className="text-[10px] text-surface-500">/mes</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================== */}
      {/* === CALCULADORA DE CUOTAS                    === */}
      {/* ============================================== */}
      <section className="py-10 lg:py-14 bg-white border-y border-surface-200">
        <div className="container-custom max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
              <CreditCard className="w-4 h-4" />
              Calculadora de cuotas
            </span>
            <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">¿Cuántas cuotas necesitas para tu próximo equipo?</h2>
            <p className="text-sm text-surface-600 mt-2">Ingresa el precio del producto y elige el plan de cuotas.</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-5 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Precio del producto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="2.500.000"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-surface-300 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Plan de cuotas</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 6, 12, 24].map((m) => (
                    <button
                      key={m}
                      onClick={() => setInstallmentMonths(m)}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                        installmentMonths === m
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white border border-surface-300 text-gray-700 hover:border-purple-400'
                      }`}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {productPriceNum > 0 && (
              <div className="bg-white rounded-xl p-4 border border-purple-100 space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wide font-bold">Cuota mensual</p>
                    <p className="text-3xl lg:text-4xl font-extrabold text-purple-600 leading-none">{formatCOP(monthlyPayment)}</p>
                    <p className="text-xs text-surface-500 mt-1">por {installmentMonths} meses · sin interés</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-500">Total</p>
                    <p className="text-base font-bold text-gray-900">{formatCOP(productPriceNum)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800">
                    Equivale al <strong>{monthlyAsPercentSalary.toFixed(1)}%</strong> del salario mínimo mensual
                  </p>
                </div>
                <Link
                  href="/productos"
                  className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Ver productos disponibles
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* === COMPARADOR ¿TE ALCANZA?                  === */}
      {/* ============================================== */}
      <section className="py-10 lg:py-14 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-3">
              <Tag className="w-4 h-4" />
              ¿Te alcanza?
            </span>
            <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">Dinos tu presupuesto y te decimos qué puedes llevar</h2>
          </div>

          <div className="max-w-md mx-auto mb-6">
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Tu presupuesto disponible</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-bold">$</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="1.500.000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-8 pr-4 py-3 border border-surface-300 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
            </div>
          </div>

          {budgetNum > 0 && budgetMatches.length > 0 && (
            <div>
              <p className="text-center text-sm text-surface-700 mb-4">
                <strong className="text-blue-700">{budgetMatches.length} producto{budgetMatches.length !== 1 ? 's' : ''}</strong> dentro de tu presupuesto de <strong>{formatCOP(budgetNum)}</strong>
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {budgetMatches.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/producto/${p.slug}`}
                    className="group bg-white rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg overflow-hidden transition-all"
                  >
                    <div className="relative aspect-square bg-surface-50">
                      {p.images?.[0]?.src && (
                        <Image src={p.images[0].src} alt={p.name} fill className="object-contain p-2 group-hover:scale-105 transition-transform" sizes="(max-width: 768px) 50vw, 25vw" />
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-blue-700">{p.name}</h4>
                      <p className="text-base font-extrabold text-blue-600">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {budgetNum > 0 && budgetMatches.length === 0 && (
            <p className="text-center text-sm text-surface-600">
              No encontramos productos en ese rango. <Link href="/productos" className="text-blue-600 font-bold underline">Ver catálogo completo →</Link>
            </p>
          )}
        </div>
      </section>

      {/* ============================================== */}
      {/* === CATEGORÍAS POR PRESUPUESTO              === */}
      {/* ============================================== */}
      <section className="py-10 lg:py-14 bg-white border-t border-surface-200">
        <div className="container-custom max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-2">Categorías populares con tu salario mínimo</h2>
            <p className="text-sm text-surface-600">Explora qué tipo de producto se ajusta a tu presupuesto.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {categoriasPresupuesto.map((cat) => (
              <Link
                key={cat.label}
                href={`/productos?max=${cat.max}`}
                className="bg-gradient-to-br from-surface-50 to-white border border-surface-200 hover:border-primary-400 hover:shadow-lg rounded-2xl p-4 text-center transition-all group"
              >
                <div className="text-3xl mb-2">{cat.emoji}</div>
                <h3 className="text-sm font-extrabold text-gray-900 mb-1 group-hover:text-primary-600">{cat.label}</h3>
                <p className="text-xs text-surface-500 mb-2">Hasta {formatCOP(cat.max)}</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600">
                  Ver opciones <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* === FAQ + Schema (handled in page.tsx)      === */}
      {/* ============================================== */}
      {faqItems.length > 0 && (
        <section className="py-10 lg:py-14 bg-surface-50 border-t border-surface-200">
          <div className="container-custom max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                <HelpCircle className="w-4 h-4" />
                Preguntas frecuentes
              </span>
              <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">Todo sobre el salario mínimo {CURRENT.year}</h2>
            </div>

            <div className="space-y-2">
              {faqItems.map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-surface-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-surface-50 transition-colors"
                    aria-expanded={openFaq === i}
                  >
                    <span className="text-sm lg:text-base font-bold text-gray-900">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-surface-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180 text-primary-600' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 pt-1 text-sm text-surface-700 leading-relaxed border-t border-surface-100">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================== */}
      {/* === STICKY CTA — CUOTAS DESDE $X/MES        === */}
      {/* ============================================== */}
      {stickyVisible && !stickyDismissed && cheapestProduct && (
        <div className="fixed left-3 bottom-3 lg:left-6 lg:bottom-6 z-40 max-w-xs animate-slide-up">
          <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl shadow-2xl p-4 pr-9">
            <button
              onClick={() => setStickyDismissed(true)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">Cuotas sin interés</span>
            </div>
            <p className="text-xs opacity-90 leading-tight mb-1">Compra hoy desde</p>
            <p className="text-2xl font-extrabold leading-none mb-2">{formatCOP(cheapestMonthly)}<span className="text-xs font-bold opacity-80">/mes</span></p>
            <Link
              href="/productos"
              className="flex items-center justify-center gap-1.5 bg-white text-emerald-700 text-xs font-extrabold rounded-lg py-2 px-3 hover:bg-emerald-50 transition-colors"
            >
              Ver opciones <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
