import supabaseClient from '../config/supabase';

async function run() {
  const { data, error } = await supabaseClient.from('categories').select('*');
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
  process.exit(0);
}

run();
