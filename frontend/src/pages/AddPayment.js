import React from 'react';
import { MdAdd } from 'react-icons/md';
import { useT } from '../context/AppContext';
import PaymentForm from '../components/PaymentForm';

const AddPayment = () => {
  const t = useT();
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <MdAdd className="text-orange-500" />{t.addPayment}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t.appTagline}</p>
      </div>
      <div className="card p-5"><PaymentForm /></div>
    </div>
  );
};

export default AddPayment;
