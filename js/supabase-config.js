// ============================================
// Supabase Configuration — Cardoso Palace Hotel
// ============================================
const SUPABASE_URL = 'https://rquggkwzrftsgykntpjm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdWdna3d6cmZ0c2d5a250cGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDMyMjYsImV4cCI6MjA3Nzc3OTIyNn0.VkVZq3Qr9RvEnavh4TlvkM2vHktFefhigjCFSINVUzw';

const supabase = {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },

    async select(table, query = '') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
            headers: this.headers
        });
        if (!res.ok) throw new Error(`Supabase SELECT error: ${res.statusText}`);
        return res.json();
    },

    async insert(table, data) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Supabase INSERT error: ${JSON.stringify(err)}`);
        }
        return res.json();
    },

    async update(table, id, data, idColumn = 'id') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idColumn}=eq.${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Supabase UPDATE error: ${JSON.stringify(err)}`);
        }
        return res.json();
    },

    async delete(table, id, idColumn = 'id') {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${idColumn}=eq.${id}`, {
            method: 'DELETE',
            headers: this.headers
        });
        if (!res.ok) throw new Error(`Supabase DELETE error: ${res.statusText}`);
        return true;
    },

    async rpc(fn, params = {}) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(params)
        });
        if (!res.ok) throw new Error(`Supabase RPC error: ${res.statusText}`);
        return res.json();
    }
};
