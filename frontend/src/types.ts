import React from 'react';

export interface NodeData {
  id: string;
  type?: string;
  data: Record<string, any>;
  position?: { x: number; y: number };
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface TaxonomyNode {
  title: string;
  key: string;
  count: number;
  icon?: React.ReactNode;
  children?: TaxonomyNode[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'ACTIVE' | 'HIDDEN';
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: 'PENDING' | 'PACKING' | 'SHIPPING' | 'SUCCESS' | 'FAILED';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Customer';
  status: 'Active' | 'Locked';
  lastLogin: string;
  avatar?: string;
}
