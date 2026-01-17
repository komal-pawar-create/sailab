import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Calculator, 
  Clock, 
  TrendingUp, 
  IndianRupee,
  Users,
  FileText,
  CheckCircle2
} from 'lucide-react';

const ROICalculator = () => {
  const [patientsPerDay, setPatientsPerDay] = useState([50]);
  const [staffCount, setStaffCount] = useState([3]);
  const [hoursPerPatient, setHoursPerPatient] = useState([15]); // minutes

  const calculations = useMemo(() => {
    const patients = patientsPerDay[0];
    const staff = staffCount[0];
    const minutesPerPatient = hoursPerPatient[0];

    // Time savings calculation
    const currentTimePerPatient = minutesPerPatient; // minutes
    const optimizedTimePerPatient = Math.max(2, minutesPerPatient * 0.3); // 70% reduction, min 2 min
    const timeSavedPerPatient = currentTimePerPatient - optimizedTimePerPatient;
    const dailyTimeSaved = (patients * timeSavedPerPatient) / 60; // hours
    const monthlyTimeSaved = dailyTimeSaved * 26; // working days

    // Cost savings calculation
    const avgHourlyWage = 150; // INR
    const monthlyCostSaved = monthlyTimeSaved * avgHourlyWage;

    // Error reduction
    const avgBillingErrorRate = 0.05; // 5%
    const avgErrorCost = 200; // INR per error
    const monthlyBills = patients * 26;
    const errorCostSaved = monthlyBills * avgBillingErrorRate * avgErrorCost;

    // Total monthly savings
    const totalMonthlySavings = monthlyCostSaved + errorCostSaved;

    return {
      dailyTimeSaved: Math.round(dailyTimeSaved * 10) / 10,
      monthlyTimeSaved: Math.round(monthlyTimeSaved),
      monthlyCostSaved: Math.round(monthlyCostSaved),
      errorCostSaved: Math.round(errorCostSaved),
      totalMonthlySavings: Math.round(totalMonthlySavings),
      patientsCapacityIncrease: Math.round((dailyTimeSaved * 60) / optimizedTimePerPatient)
    };
  }, [patientsPerDay, staffCount, hoursPerPatient]);

  return (
    <section className="py-20 px-4 bg-muted/30" aria-labelledby="roi-heading">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">ROI Calculator</Badge>
          <h2 id="roi-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Calculate Your <span className="gradient-text">Savings</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how much time and money Lab Master can save your laboratory every month
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input sliders */}
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Your Lab Details
              </CardTitle>
              <CardDescription>
                Adjust the sliders to match your laboratory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Patients per day
                  </label>
                  <span className="text-lg font-bold text-primary">{patientsPerDay[0]}</span>
                </div>
                <Slider
                  value={patientsPerDay}
                  onValueChange={setPatientsPerDay}
                  min={10}
                  max={200}
                  step={5}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10</span>
                  <span>200+</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Staff members
                  </label>
                  <span className="text-lg font-bold text-primary">{staffCount[0]}</span>
                </div>
                <Slider
                  value={staffCount}
                  onValueChange={setStaffCount}
                  min={1}
                  max={20}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Minutes per patient (current)
                  </label>
                  <span className="text-lg font-bold text-primary">{hoursPerPatient[0]} min</span>
                </div>
                <Slider
                  value={hoursPerPatient}
                  onValueChange={setHoursPerPatient}
                  min={5}
                  max={30}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5 min</span>
                  <span>30 min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="glass border-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Estimated Savings
              </CardTitle>
              <CardDescription>
                Based on your inputs, here's what you can expect
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Time savings */}
              <div className="p-4 rounded-xl bg-background/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Time Saved Per Month
                </div>
                <div className="text-3xl font-bold text-primary">
                  {calculations.monthlyTimeSaved} hours
                </div>
                <p className="text-sm text-muted-foreground">
                  ({calculations.dailyTimeSaved} hours per day)
                </p>
              </div>

              {/* Cost savings */}
              <div className="p-4 rounded-xl bg-background/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <IndianRupee className="h-4 w-4" />
                  Labor Cost Saved
                </div>
                <div className="text-3xl font-bold text-primary">
                  ₹{calculations.monthlyCostSaved.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>

              {/* Error reduction savings */}
              <div className="p-4 rounded-xl bg-background/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  Billing Error Savings
                </div>
                <div className="text-3xl font-bold text-primary">
                  ₹{calculations.errorCostSaved.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>

              {/* Total */}
              <div className="p-4 rounded-xl bg-primary text-primary-foreground">
                <div className="text-sm opacity-90 mb-1">Total Monthly Savings</div>
                <div className="text-4xl font-bold">
                  ₹{calculations.totalMonthlySavings.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
                  <CheckCircle2 className="h-4 w-4" />
                  Can handle {calculations.patientsCapacityIncrease} more patients daily
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
