"use client";

import React, { useState, FormEvent } from 'react';
import { useLootboxCrud } from '@/hooks/useLootboxCrud';
import { useStockCrud } from '@/hooks/useStockCrud';

export const LootboxManager = () => {
  // Fetch lootboxes; default to empty array
  const {
    lootboxes = [],
    createLootbox,
    updateLootbox,
    deleteLootbox,
    isLoading: lootboxLoading,
    error: lootboxError
  } = useLootboxCrud();

  const { stocks = [] } = useStockCrud();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    selectedStocks: [] as string[]
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  //const [loadingLootboxes, setLoadingLootboxes] = useState<boolean>(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStockToggle = (stockId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedStocks: prev.selectedStocks.includes(stockId)
        ? prev.selectedStocks.filter((id) => id !== stockId)
        : [...prev.selectedStocks, stockId],
    }));
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const lootboxData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price.toString()),
      stocks: formData.selectedStocks
    };

    try {
      if (editingId) {
        await updateLootbox(editingId, lootboxData);
        setEditingId(null);
      } else {
        await createLootbox(lootboxData);
      }

      setFormData({
        name: '',
        description: '',
        price: 0,
        selectedStocks: []
      });
    } catch (error) {
      console.error('Error submitting lootbox:', error);
    }
  };

  const handleEdit = (lootbox: any) => {
    setEditingId(lootbox.id);
    setFormData({
      name: lootbox.name,
      description: lootbox.description || '',
      price: lootbox.price,
      // Guard stocks array
      selectedStocks: lootbox.stocks?.map((stock: any) => stock.id) ?? []
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lootbox?')) {
      try {
        await deleteLootbox(id);
      } catch (error) {
        console.error('Error deleting lootbox:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      selectedStocks: []
    });
  };

  return (
    <div className="min-h-full bg-gray-50 ">
      <div className="mx-auto px-4 py-2 max-w-7xl">
        {lootboxError && (
          <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 font-medium">{lootboxError}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="lg:w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? 'Edit Lootbox' : 'Create New Lootbox'}
              <span className="block mt-1 text-sm font-normal text-gray-500">
                {editingId ? 'Update your existing lootbox' : 'Add a new lootbox to your collection'}
              </span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (tokens)
                </label>
                <input
                  type="number"
                  name="price"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Stocks
                </label>
                <div className="h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-2">
                    {stocks.map((stock) => (
                      <label
                        key={stock.id}
                        className="flex items-center p-3 bg-white rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={formData.selectedStocks.includes(stock.id)}
                          onChange={() => handleStockToggle(stock.id)}
                        />
                        <span className="ml-3 text-sm">
                          <span className="font-medium text-gray-700">{stock.name}</span>
                          <span className="text-gray-500 ml-2">${stock.price.toFixed(2)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={lootboxLoading}
                >
                  {lootboxLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Processing...
                    </span>
                  ) : editingId ? (
                    'Update Lootbox'
                  ) : (
                    'Create Lootbox'
                  )}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lootbox List */}
          <div className="lg:w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Existing Lootboxes
              <span className="block mt-1 text-sm font-normal text-gray-500">
                {lootboxes.length} lootbox{lootboxes.length !== 1 ? 'es' : ''} available
              </span>
            </h2>

            {!Array.isArray(lootboxes) || lootboxes.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">No lootboxes found. Start by creating a new one!</p>
              </div>
            ) : (
              <div className="space-y-4 pr-2 h-[calc(100vh-260px)] overflow-y-auto custom-scrollbar">
                {lootboxes.map((lootbox) => {
                  const boxStocks = lootbox.stocks || [];
                  return (
                    <div
                      key={lootbox.id}
                      className="group p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {lootbox.name}
                            {editingId === lootbox.id && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                Editing
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {lootbox.description || 'No description'}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {lootbox.price} tokens
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          Included stocks ({boxStocks.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {boxStocks.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">No stocks selected</span>
                          ) : (
                            boxStocks.map((stock: any) => (
                              <span
                                key={stock.id}
                                className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                              >
                                {stock.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-4">
                        <button
                          onClick={() => handleEdit(lootbox)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(lootbox.id)}
                          className="flex items-center text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LootboxManager;
