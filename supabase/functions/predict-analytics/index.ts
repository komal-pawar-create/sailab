import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { labId, historicalData } = await req.json();

    if (!labId || !historicalData) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing historical data for predictions...');

    const systemPrompt = `You are a healthcare analytics expert specializing in predictive modeling for laboratory operations. 
Analyze the provided historical data and generate accurate forecasts for future revenue and patient trends.
Consider seasonal patterns, growth trends, and operational efficiency metrics.
Return predictions in a structured format with confidence intervals.`;

    const userPrompt = `Analyze this historical lab data and provide predictions for the next 30 days:

Historical Data Summary:
${JSON.stringify(historicalData, null, 2)}

Please provide:
1. Daily revenue predictions for the next 30 days
2. Daily patient count predictions for the next 30 days
3. Key trends and insights
4. Confidence level for predictions (high/medium/low)
5. Factors influencing the predictions
6. Recommendations for improving performance`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_predictions',
              description: 'Generate revenue and patient predictions with insights',
              parameters: {
                type: 'object',
                properties: {
                  revenuePredictions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string' },
                        predictedRevenue: { type: 'number' },
                        lowerBound: { type: 'number' },
                        upperBound: { type: 'number' }
                      },
                      required: ['date', 'predictedRevenue', 'lowerBound', 'upperBound']
                    }
                  },
                  patientPredictions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string' },
                        predictedPatients: { type: 'number' },
                        lowerBound: { type: 'number' },
                        upperBound: { type: 'number' }
                      },
                      required: ['date', 'predictedPatients', 'lowerBound', 'upperBound']
                    }
                  },
                  insights: {
                    type: 'object',
                    properties: {
                      keyTrends: { type: 'array', items: { type: 'string' } },
                      confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                      factors: { type: 'array', items: { type: 'string' } },
                      recommendations: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['keyTrends', 'confidence', 'factors', 'recommendations']
                  }
                },
                required: ['revenuePredictions', 'patientPredictions', 'insights'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_predictions' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate predictions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in AI response');
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const predictions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(predictions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in predict-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
