"use client";

import React, { useState, FormEvent } from 'react';
import { useLootboxCrud } from '@/hooks/useLootboxCrud';
import { useStockCrud } from '@/hooks/useStockCrud';

export default function LootboxManager() {
  const { lootboxes, createLootbox, updateLootbox, deleteLootbox, isLoading: lootboxLoading, error: lootboxError } = useLootboxCrud();
  const { stocks } = useStockCrud();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    selectedStocks: [] as string[]
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStockSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, selectedStocks: selectedOptions }));
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
      
      // Reset form
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
      selectedStocks: lootbox.stocks.map((stock: any) => stock.id)
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
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Lootbox Manager</h1>
        
        {lootboxError && (
          <div className="bg-red-500 text-white p-4 rounded mb-6">
            Error: {lootboxError}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lootbox Form */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingId ? 'Edit Lootbox' : 'Create New Lootbox'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2" htmlFor="price">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-300 mb-2" htmlFor="stocks">
                  Stocks
                </label>
                <select
                  id="stocks"
                  name="stocks"
                  className="w-full bg-gray-700 text-white p-2 rounded"
                  multiple
                  value={formData.selectedStocks}
                  onChange={handleStockSelection}
                  size={5}
                >
                  {stocks?.map(stock => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name} ({stock.ticker}) - ${stock.price.toFixed(2)}
                    </option>
                  ))}
                </select>
                <p className="text-gray-400 text-sm mt-1">
                  Hold Ctrl/Cmd to select multiple stocks
                </p>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  disabled={lootboxLoading}
                >
                  {lootboxLoading ? 'Processing...' : editingId ? 'Update Lootbox' : 'Create Lootbox'}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          {/* Lootbox List */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Existing Lootboxes
            </h2>
            
            {lootboxes?.length === 0 ? (
              <p className="text-gray-400">No lootboxes available.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {lootboxes?.map(lootbox => (
                  <div key={lootbox.id} className="border border-gray-700 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-white">{lootbox.name}</h3>
                      <span className="text-green-400 font-bold">${lootbox.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-2">{lootbox.description}</p>
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Stocks:</h4>
                      <div className="flex flex-wrap gap-1">
                        {lootbox.stocks.length === 0 ? (
                          <span className="text-gray-400 text-xs">No stocks</span>
                        ) : (
                          lootbox.stocks.map(stock => (
                            <span key={stock.id} className="bg-gray-700 text-xs text-white px-2 py-1 rounded">
                              {stock.ticker}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-blue-400 hover:text-blue-300 text-sm"
                        onClick={() => handleEdit(lootbox)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-400 hover:text-red-300 text-sm"
                        onClick={() => handleDelete(lootbox.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 