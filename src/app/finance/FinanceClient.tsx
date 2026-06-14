'use client';

import { useState } from 'react';
import { createTransaction } from '@/features/finance/actions';
import { formatCurrency } from '@/lib/currency';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FinanceClient({ categories, transactions, summary, currency }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createTransaction({
        financeCategoryId: categoryId,
        amount: parseFloat(amount),
        description,
        transactionDate: new Date(transactionDate)
      });
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Error creating transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Finanzas" 
        description="Controla tus ingresos y gastos del mes."
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col justify-center text-center p-8">
          <h2 className="text-sm text-slate-500 uppercase tracking-wider mb-2 font-bold">Total Ingresos</h2>
          <p className="text-4xl font-black text-emerald-600">{formatCurrency(summary.totalIncome, currency)}</p>
        </Card>
        <Card className="flex flex-col justify-center text-center p-8">
          <h2 className="text-sm text-slate-500 uppercase tracking-wider mb-2 font-bold">Total Gastos</h2>
          <p className="text-4xl font-black text-red-600">{formatCurrency(summary.totalExpense, currency)}</p>
        </Card>
        <Card className="flex flex-col justify-center text-center p-8 bg-slate-900 border-slate-900 text-white">
          <h2 className="text-sm text-slate-400 uppercase tracking-wider mb-2 font-bold">Balance Neto</h2>
          <p className="text-4xl font-black">{formatCurrency(summary.balance, currency)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chart */}
        <Card className="flex flex-col">
          <h2 className="text-xl font-bold mb-6 text-slate-800 border-b border-slate-100 pb-2">Gastos por Categoría</h2>
          <div className="flex flex-col items-center justify-center space-y-4 flex-1">
            {summary.distribution.length > 0 ? (
               <div className="flex flex-row items-center space-x-8">
                 <PieChart data={summary.distribution} />
                 <div className="space-y-3">
                   {summary.distribution.map((d: any, i: number) => (
                     <div key={i} className="flex items-center space-x-3 text-sm">
                       <span className="w-4 h-4 block rounded-none" style={{ backgroundColor: d.color }}></span>
                       <span className="font-medium text-slate-700">{d.name}:</span>
                       <span className="font-bold text-slate-900">{formatCurrency(d.amount, currency)}</span>
                     </div>
                   ))}
                 </div>
               </div>
            ) : (
               <p className="text-slate-500 italic py-8">No hay gastos este mes.</p>
            )}
          </div>
        </Card>

        {/* Transactions List */}
        <Card className="flex flex-col max-h-[450px]">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
            <h2 className="text-xl font-bold text-slate-800">Transacciones Recientes</h2>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>+ Nueva</Button>
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 flex-1">
            {transactions.length === 0 && (
              <EmptyState 
                title="Sin movimientos" 
                description="Agrega tu primer movimiento financiero."
                className="border-0 shadow-none"
              />
            )}
            {transactions.map((t: any) => (
              <div key={t.id} className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-none" style={{ backgroundColor: t.category.color }} title={t.category.name} />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.description || t.category.name}</p>
                    <p className="text-xs text-slate-500">{new Date(t.transactionDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={`font-black text-sm ${t.category.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.category.type === 'INGRESO' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Transacción">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select 
            required
            label="Categoría"
            value={categoryId} 
            onChange={e => setCategoryId(e.target.value)}
            options={[
              { value: "", label: "Seleccionar categoría" },
              ...categories.map((c: any) => ({ value: c.id, label: `${c.name} (${c.type})` }))
            ]}
          />
          <Input 
            type="number" 
            required
            step="0.01"
            min="0"
            label="Monto"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <Input 
            type="date" 
            required
            label="Fecha"
            value={transactionDate}
            onChange={e => setTransactionDate(e.target.value)}
          />
          <Input 
            type="text" 
            label="Descripción (Opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Sueldo, súper, etc."
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Transacción'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function PieChart({ data }: { data: any[] }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        <circle cx="50" cy="50" r="50" fill="#f3f4f6" />
      </svg>
    );
  }
  
  let currentAngle = 0;
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
      {data.map((item, i) => {
        const sliceAngle = (item.amount / total) * 360;
        if (sliceAngle === 360) {
          return <circle key={i} cx="50" cy="50" r="50" fill={item.color || '#ccc'} />;
        }
        
        const x1 = 50 + 50 * Math.cos((Math.PI * currentAngle) / 180);
        const y1 = 50 + 50 * Math.sin((Math.PI * currentAngle) / 180);
        
        currentAngle += sliceAngle;
        
        const x2 = 50 + 50 * Math.cos((Math.PI * currentAngle) / 180);
        const y2 = 50 + 50 * Math.sin((Math.PI * currentAngle) / 180);
        
        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        
        const d = [
          `M 50 50`,
          `L ${x1} ${y1}`,
          `A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `Z`
        ].join(' ');

        return (
          <path
            key={i}
            d={d}
            fill={item.color || '#ccc'}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{`${item.name}: $${item.amount}`}</title>
          </path>
        );
      })}
    </svg>
  );
}
