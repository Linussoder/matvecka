const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class ProductsDB {
  static async createWeek(storeId, startDate, endDate) {
    const { data, error } = await supabase
      .from('weeks')
      .insert({
        store_id: storeId,
        start_date: startDate,
        end_date: endDate
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create week: ${error.message}`);
    }

    return data;
  }

  static async saveProducts(weekId, products) {
    const productsWithWeek = products.map(product => ({
      week_id: weekId,
      name: product.name,
      price: product.price || 0,
      unit: product.unit || 'st',
      image_url: product.image_url,
      category: product.category || 'övrigt',
      url: product.url
    }));

    const { data, error } = await supabase
      .from('products')
      .insert(productsWithWeek);

    if (error) {
      throw new Error(`Failed to save products: ${error.message}`);
    }

    return data;
  }

  static async getProductsByWeek(weekId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('week_id', weekId);

    if (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }

    return data;
  }

  static async getCurrentWeek(storeId) {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('weeks')
      .select('*')
      .eq('store_id', storeId)
      .lte('start_date', today)
      .gte('end_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get current week: ${error.message}`);
    }

    return data;
  }
}

module.exports = ProductsDB;
