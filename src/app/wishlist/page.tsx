'use client'
import React, { useState, useEffect } from 'react';
import './Wishlist.css';

interface Item {
  id: number;
  name: string;
  type: 'stock' | 'crypto';
}

const Wishlist: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [type, setType] = useState<'stock' | 'crypto'>('stock');
  const [editItemId, setEditItemId] = useState<number | null>(null);

  // Load items from local storage (for now) on component mount
  useEffect(() => {
    const savedItems = localStorage.getItem('wishlistItems');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  const addItem = () => {
    if (inputValue.trim() === '') return;

    const newItem: Item = {
      id: Date.now(),
      name: inputValue,
      type,
    };

    if (editItemId) {
      setItems(items.map(item => (item.id === editItemId ? newItem : item)));
      setEditItemId(null);
    } else {
      setItems([...items, newItem]);
    }

    setInputValue('');
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const startEdit = (item: Item) => {
    setInputValue(item.name);
    setType(item.type);
    setEditItemId(item.id);
  };

  const saveItems = () => {
    // We can also update the database (if we wanted to store this on the database)
    localStorage.setItem('wishlistItems', JSON.stringify(items));
    alert('Wishlist saved!');
  };

  return (
    <div>
      <h1 style={{ color: 'lime', fontWeight: 'bold' }}>Your Wishlist</h1>
      <div>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter stock or crypto name"/>
        <select value={type} onChange={(e) => setType(e.target.value as 'stock' | 'crypto')}>
            <option value="stock">Stock</option>
            <option value="crypto">Crypto</option>
        </select>
        <button onClick={addItem}>{editItemId ? 'Update Item' : 'Add to Wishlist'}</button>
        <button onClick={saveItems}>Save</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
            <tbody> {items.map(item => (
                <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>
                        <button onClick={() => startEdit(item)}>Edit</button>
                    <button onClick={() => removeItem(item.id)}>Remove</button>
                </td>
            </tr>
            ))}
            </tbody>
        </table>
    </div>
  );
};

export default Wishlist;