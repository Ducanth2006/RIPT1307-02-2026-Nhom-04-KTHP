import supabaseClient from '../config/supabase';

// Lấy danh sách tất cả khách hàng
export const fetchAllCustomers = async () => {
    const { data: customerList, error: fetchError } = await supabaseClient
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;
    return customerList;
};

// Khóa hoặc mở khóa tài khoản khách hàng
export const toggleCustomerStatus = async (customerId: string, isActive: boolean) => {
    const { data: updatedCustomer, error: updateError } = await supabaseClient
        .from('users')
        .update({ status: isActive ? 'active' : 'inactive' })
        .eq('id', customerId)
        .select()
        .single();

    if (updateError) throw updateError;
    return updatedCustomer;
};
