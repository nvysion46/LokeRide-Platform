// client/src/dataProvider.js
const API_URL = 'http://localhost:5000';

const jsonFetch = async (url, options = {}) => {
    const token = localStorage.getItem('access_token');
    const headers = { 
        Accept: 'application/json', 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers 
    };
    const response = await fetch(url, { ...options, headers });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message);
    return json;
};

export default {
    getList: async (resource, params) => {
        const { page, perPage } = params.pagination;
        const url = `${API_URL}/admin/${resource}?page=${page}&per_page=${perPage}`;
        const { items, total } = await jsonFetch(url);
        return { data: items, total };
    },
    getOne: async (resource, params) => {
        const data = await jsonFetch(`${API_URL}/admin/${resource}/${params.id}`);
        return { data };
    },
    create: async (resource, params) => {
        const { car } = await jsonFetch(`${API_URL}/admin/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data)
        });
        return { data: car };
    },
    update: async (resource, params) => {
        const { booking } = await jsonFetch(`${API_URL}/admin/${resource}/${params.id}`, {
            method: 'PATCH',
            body: JSON.stringify(params.data)
        });
        return { data: booking };
    },
    // Add delete/getMany if needed
};