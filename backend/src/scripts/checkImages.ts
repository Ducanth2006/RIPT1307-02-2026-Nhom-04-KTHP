import supabaseClient from '../config/supabase';

async function check() {
    const { data: products, error } = await supabaseClient
        .from('products')
        .select(`
            id,
            name,
            product_images (
                image_url,
                is_main
            )
        `)
        .limit(10);
    
    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log('--- Product Image check ---');
    products.forEach((p) => {
        console.log(`Product: ${p.name} (ID: ${p.id})`);
        console.log('Images:', JSON.stringify(p.product_images, null, 2));
    });
    process.exit(0);
}

check();
