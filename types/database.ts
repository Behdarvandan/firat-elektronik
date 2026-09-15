/**
 * Merkezi Supabase veritabanı şema tipleri.
 *
 * Bu dosya; `lib/supabase.ts`, `lib/supabase-admin.ts`, sunucu aksiyonları ve
 * UI bileşenleri tarafından paylaşılır. Tablo kolonlarının null durumu, seed
 * verisi ve mevcut sorgularla birebir örtüşecek şekilde tutulur.
 *
 * NOT: `interface` yerine `type` kullanılması bilinçlidir — supabase-js v2'nin
 * `GenericSchema` kısıtı (Row: Record<string, unknown>) yalnızca `type` alias'ları
 * ve inline object literal tiplerini kabul eder; `interface` bu kısıtı karşılamaz.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ----------------------------------------------------------------------------
// categories
// ----------------------------------------------------------------------------

export type CategoryRow = {
  id: number;
  name: string;
  color: string | null;
  prefix: string | null;
};

export type CategoryInsert = {
  id?: number;
  name: string;
  color?: string | null;
  prefix?: string | null;
};

export type CategoryUpdate = Partial<CategoryInsert>;

// ----------------------------------------------------------------------------
// products
// ----------------------------------------------------------------------------

export type ProductRow = {
  id: number;
  category_id: number;
  name: string;
  box_code: string | null;
  box_code_note: string | null;
  capacity: string | null;
  product_code: string | null;
  specs: Json | null;
  description: string | null;
};

export type ProductInsert = {
  id?: number;
  category_id: number;
  name: string;
  box_code?: string | null;
  box_code_note?: string | null;
  capacity?: string | null;
  product_code?: string | null;
  specs?: Json | null;
  description?: string | null;
};

export type ProductUpdate = Partial<ProductInsert>;


// ----------------------------------------------------------------------------
// product_models
// ----------------------------------------------------------------------------

export type ProductModelRow = {
  id: string;
  product_id: number;
  model_name: string;
  sort_order: number;
  is_new: boolean;
  description: string | null;
  price: number | null;
  image_url: string | null;
  created_at: string | null;
};

export type ProductModelInsert = {
  id?: string;
  product_id: number;
  model_name: string;
  sort_order?: number;
  is_new?: boolean;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  created_at?: string | null;
};

export type ProductModelUpdate = Partial<ProductModelInsert>;


// ----------------------------------------------------------------------------
// B2B: organizations / orders / order_items
// ----------------------------------------------------------------------------

export type OrganizationRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export type OrganizationInsert = {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at?: string;
};

export type OrganizationUpdate = Partial<OrganizationInsert>;

export type OrderRow = {
  id: string;
  organization_id: string;
  total_amount: number;
  status: string;
  note: string | null;
  created_at: string;
};

export type OrderInsert = {
  id?: string;
  organization_id: string;
  total_amount?: number;
  status?: string;
  note?: string | null;
  created_at?: string;
};

export type OrderUpdate = Partial<OrderInsert>;

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
};

export type OrderItemInsert = {
  id?: string;
  order_id: string;
  product_id: number;
  quantity?: number;
  unit_price?: number;
};

export type OrderItemUpdate = Partial<OrderItemInsert>;

// ----------------------------------------------------------------------------
// Database (supabase-js generic'i)
// ----------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_models: {
        Row: ProductModelRow;
        Insert: ProductModelInsert;
        Update: ProductModelUpdate;
        Relationships: [
          {
            foreignKeyName: "product_models_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: OrganizationRow;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: OrderItemInsert;
        Update: OrderItemUpdate;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
