import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentWebhookData {
  OrderTrackingId: string;
  OrderMerchantReference: string;
  OrderNotificationType: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse webhook data
    const webhookData: PaymentWebhookData = await req.json()
    
    console.log('Payment webhook received:', webhookData)

    const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = webhookData

    if (!OrderTrackingId) {
      throw new Error('Missing OrderTrackingId in webhook data')
    }

    // Here you would typically:
    // 1. Verify the webhook signature (if PesaPal provides one)
    // 2. Query PesaPal API to get the actual payment status
    // 3. Update your database accordingly

    // For now, we'll log the webhook and update the payment transaction
    const { data: transaction, error: fetchError } = await supabaseClient
      .from('payment_transactions')
      .select('*')
      .eq('tracking_id', OrderTrackingId)
      .single()

    if (fetchError) {
      console.error('Error fetching transaction:', fetchError)
      // Don't throw error here as the transaction might not exist yet
    }

    // Update or insert payment transaction record
    const { error: upsertError } = await supabaseClient
      .from('payment_transactions')
      .upsert({
        tracking_id: OrderTrackingId,
        merchant_reference: OrderMerchantReference,
        callback_data: webhookData,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Error updating payment transaction:', upsertError)
      throw upsertError
    }

    // If we have a transaction, update the related order
    if (transaction) {
      const { error: orderError } = await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed', // You should verify this with PesaPal API
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.order_id)

      if (orderError) {
        console.error('Error updating order:', orderError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed', 
        message: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})