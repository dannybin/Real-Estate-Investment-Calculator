
var assert = require('assert'),
    self = this;
var accounting = require("accounting");


exports.index = function(req, res){

  res.render('index', {status : "hide-table",
                       TaxDeduct : "100",
                       Year : "1"});
};



exports.calculate = function(req, res){


  var Rate = req.body.Rate/100;
  var TaxRate = req.body.TaxRate/100;
  var TaxDeduct = req.body.TaxDeduct/100;
  var DownPay = req.body.DownPay/100;
  var HOA = req.body.HOA/1.0;
  var PurchasePrice = req.body.PurchasePrice/1.0;
  var Year = req.body.Year/1.0;
  var SoldPrice = req.body.SoldPrice/1.0;
  var RRR = req.body.RRR/100;
  var TLC = req.body.TLC/1.0;
  var Closing = req.body.Closing/1.0;
  var Commission = req.body.Commission/100;
  var RentalIncome = req.body.RentalIncome/1.0;
  var CapitalGainTax = 0.25;

  var DownPayment = DownPay * PurchasePrice;
  var Loan = PurchasePrice - DownPayment;
  var AnnualHOA = HOA*12;
  var MonthlyMortgage = Loan/((1-Math.pow((1+Rate/12),-360))/(Rate/12));
  var AnnualMortgage = MonthlyMortgage * 12;
  var AnnualInterest = AnnualMortgage - (MonthlyMortgage*((1-Math.pow((1+Rate/12),(-360+(Year-1)*12)))/(Rate/12))
                        - MonthlyMortgage*((1-Math.pow((1+Rate/12),(-360+Year*12)))/(Rate/12)));
  var MonthlyInterest = AnnualInterest/12;
  var MonthlyPrincipal = MonthlyMortgage - MonthlyInterest;
  var AnnualPrincipal = MonthlyPrincipal*12; 
  var MonthlyExpense = MonthlyMortgage*1.0 + HOA*1.0;
  var AnnualExpense = MonthlyExpense*12;
  var MonthlyTaxSaving = MonthlyInterest * TaxRate + HOA*TaxDeduct*TaxRate;
  var AnnualTaxSaving = MonthlyTaxSaving*12;
  var MonthlyNetExpense = MonthlyExpense - MonthlyTaxSaving;
  var AnnualNetExpense = MonthlyNetExpense*12;

  var PrincipalRemaining = MonthlyMortgage*((1-Math.pow((1+Rate/12), (-360+Year*12)))/(Rate/12));
  var PrincipalPaid = Loan - PrincipalRemaining;
  var InterestPaid = AnnualMortgage*Year - PrincipalPaid;
  var HOAPaid = AnnualHOA*Year;
  var PropertyOperatingExp = InterestPaid+HOAPaid;
  var PropertyOperatingExpWithTax = InterestPaid*(1-TaxRate)+HOAPaid*(1-TaxDeduct)+HOAPaid*TaxDeduct*(1-TaxRate);
  var NetOperatingWithRent = PropertyOperatingExpWithTax - RentalIncome*Year*12;
  var TotalExpenseWithRent = NetOperatingWithRent + PrincipalPaid;
  var TotalContributionWithTaxSaving = TotalExpenseWithRent + Closing + TLC + DownPayment;

  var NetProfit = (SoldPrice*(1-Commission)-Closing-TLC-PrincipalRemaining-TotalContributionWithTaxSaving*Math.pow((1+RRR), Year))*(1-CapitalGainTax);
  var AnnualReturn = (Math.pow(((NetProfit + TotalContributionWithTaxSaving)/TotalContributionWithTaxSaving), (1/Year))-1)*100;
  var EffectiveReturn = AnnualReturn - RRR;

  var Test = MonthlyMortgage*1.0 + HOA*1.0;
  res.render('index', {DownPayment : accounting.formatNumber(DownPayment,0,","),
                       Rate : Rate*100,
                       TaxRate : TaxRate*100,
                       TaxDeduct : TaxDeduct*100,
                       PurchasePrice : PurchasePrice,
                       DownPay : DownPay*100,
                       SoldPrice : SoldPrice,
                       Closing : Closing,
                       TLC : TLC,
                       Commission : Commission*100,
                       RRR : RRR*100,
                       Year : Year,
                       RentalIncome : RentalIncome,
                       HOA : HOA,
                       Loan : accounting.formatNumber(Loan,0,","),
                       status : "show-table",
                       AnnualHOA : accounting.formatNumber(AnnualHOA,0,","),
                       MonthlyMortgage : accounting.formatNumber(MonthlyMortgage,0,","),
                       AnnualMortgage : accounting.formatNumber(AnnualMortgage,0,","),
                       MonthlyInterest : accounting.formatNumber(MonthlyInterest,0,","),
                       AnnualInterest : accounting.formatNumber(AnnualInterest,0,","),
                       MonthlyPrincipal : accounting.formatNumber(MonthlyPrincipal,0,","),
                       AnnualPrincipal : accounting.formatNumber(AnnualPrincipal,0,","),
                       MonthlyExpense : accounting.formatNumber(MonthlyExpense,0,","),
                       AnnualExpense : accounting.formatNumber(AnnualExpense,0,","),
                       MonthlyTaxSaving : accounting.formatNumber(MonthlyTaxSaving,0,","),
                       AnnualTaxSaving : accounting.formatNumber(AnnualTaxSaving,0,","),
                       MonthlyNetExpense : accounting.formatNumber(MonthlyNetExpense,0,","),
                       AnnualNetExpense : accounting.formatNumber(AnnualNetExpense,0,","),
                       PrincipalRemaining : accounting.formatNumber(PrincipalRemaining,0,","),
                       PrincipalPaid : accounting.formatNumber(PrincipalPaid,0,","),
                       InterestPaid : accounting.formatNumber(InterestPaid,0,","),
                       HOAPaid : accounting.formatNumber(HOAPaid,0,","),
                       PropertyOperatingExp : accounting.formatNumber(PropertyOperatingExp,0,","),
                       PropertyOperatingExpWithTax : accounting.formatNumber(PropertyOperatingExpWithTax,0,","),
                       NetOperatingWithRent : accounting.formatNumber(NetOperatingWithRent,0,","),
                       TotalExpenseWithRent : accounting.formatNumber(TotalExpenseWithRent,0,","),
                       TotalContributionWithTaxSaving : accounting.formatNumber(TotalContributionWithTaxSaving,0,","),
                       NetProfit : accounting.formatNumber(NetProfit,0,","),
                       AnnualReturn : accounting.formatNumber(AnnualReturn,2,","),
                       EffectiveReturn : accounting.formatNumber(EffectiveReturn,2,",")
                     });
};


