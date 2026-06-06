import supabaseClient from '../config/supabase';

async function main() {
    try {
        const { data: order } = await supabaseClient
            .from('orders')
            .select('id, status, cancel_reason')
            .eq('id', 36)
            .single();
        console.log('Order #36 Status:', order?.status);
        console.log('Order #36 Cancel Reason:', order?.cancel_reason);
    } catch (err) {
        console.error('Error:', err);
    }
}

main();
