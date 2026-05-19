import supabaseClient from '../config/supabase';

export const fetchClientCategories = async () => {
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('id', { ascending: true });

    if (error) throw error;
    return data;
};
