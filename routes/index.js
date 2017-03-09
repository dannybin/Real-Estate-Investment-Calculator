
var assert = require('assert'),
    self = this;
var accounting = require("accounting");
const https = require('https');
var parseString = require('xml2js').parseString;
var async = require("async");
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;


exports.index = function(req, res){

  res.render('index', {Status : "hide-table",
                       ShowPropertyData : "hide",
                       Error : "hide",
                       TaxDeduct : "100",
                       Year : "1",
                       PropertyReset : "hide",
                       PropertyInput : "show",
                       MakeADeal : "hide",
                       BeCareful : "hide",
                     });
};

exports.fetch = function(req, res){
  var address = encodeURI(req.body.Address);
  var city = encodeURI(req.body.City);
  var state = encodeURI(req.body.State);
  var zip = req.body.Zip;
  var baseSearchURL = "https://www.zillow.com/webservice/GetDeepSearchResults.htm?zws-id=X1-ZWz19qpbqq1ibv_5cfwc&";
  var searchURL = baseSearchURL+"address="+address+"&citystatezip="+city+"+"+state+"+"+zip;
  var httpsData, result, Address, Zpid, YearBuilt, LotSize, PropertySize, Bedrooms, Bathrooms, 
      LastSoldDate, LastSoldPrice, Zestimate, LowZestimate, HighZestimate, PropertyData, AskingPrice, MLS, 
      Listing, PropertyStatus;


  async.series([
    function (callback){
       https.get(searchURL, function(res){
          res.setEncoding('utf8');
          result = res;
          callback();
       });
    },
    function (getData){
      console.log('STATUS: ' + result.statusCode);

      result.on('data', function(data){
        httpsData += data;
      });

      result.on('end', function(){
        result.destroy();
        getData();
      });
    
    },
    function (getDetail){
      var xml = new dom().parseFromString(httpsData);
      var StatusCode = xpath.select("//code", xml)[0].firstChild.data;
      //Check to make sure we have successfully extracted data
      if(StatusCode != 0)
      {
        return getDetail("No property data");
      }
      Address = xpath.select("//address", xml)[0].firstChild.data;
      Zpid = xpath.select("//zpid", xml)[0].firstChild.data;;
      YearBuilt = xpath.select("//yearBuilt", xml)[0].firstChild.data;
      LotSize = xpath.select("//lotSizeSqFt", xml)[0].firstChild.data;
      PropertySize = xpath.select("//finishedSqFt", xml)[0].firstChild.data;
      Bedrooms = xpath.select("//bedrooms", xml)[0].firstChild.data;
      Bathrooms = xpath.select("//bathrooms", xml)[0].firstChild.data;
      LastSoldDate = xpath.select("//lastSoldDate", xml)[0].firstChild.data;
      LastSoldPrice = xpath.select("//lastSoldPrice", xml)[0].firstChild.data;
      Zestimate = xpath.select("//amount", xml)[0].firstChild.data;
      LowZestimate = xpath.select("//low", xml)[0].firstChild.data;
      HighZestimate = xpath.select("//high", xml)[0].firstChild.data;

      getDetail();
    },
    function (propertyDetail){
      console.log(Zpid);
      var detailURL = "https://www.zillow.com/webservice/GetUpdatedPropertyDetails.htm?zws-id=X1-ZWz19qpbqq1ibv_5cfwc&zpid="+Zpid;
      https.get(detailURL, function(res){
        res.setEncoding('utf8');
        res.on('data', function(data){
          PropertyData += data;
        });

        res.on('end', function(){
          console.log(PropertyData);
          res.destroy();
          propertyDetail();
        });

      });

    },
    function(done){
      var xml = new dom().parseFromString(PropertyData);

      var StatusCode = xpath.select("//code", xml)[0].firstChild.data;
      console.log(StatusCode);
      //Check to make sure we have successfully extracted data
      if(StatusCode != 0)
      { 
        return done("No property listing");
      }

      Listing =  xpath.select("//posting", xml);

      if(Listing.length == 0)
      {
        return done("No property listing");
      }

      AskingPrice =  xpath.select("//price", xml)[0].firstChild.data;;
      PropertyStatus =  xpath.select("//status", xml)[0].firstChild.data;
      MLS =  xpath.select("//mls", xml)[0].firstChild.data;

      console.log(AskingPrice);
      console.log(PropertyStatus);
      console.log(MLS);

      done();
    }
  ], function (err){

      console.log(err);
      if(err == "No property data"){
        res.render('index', {Status : "hide-table",
                            ShowPropertyData : "hide",
                            Error : "show",
                            ErrorMessage : "No Property Data",
                            TaxDeduct : "100",
                            Year : "1",
                            PropertyReset : "show",
                            PropertyInput : "hide"
                          });
      }
      else if(err == "No property listing"){
        res.render('index', {Status : "hide-table",
                            ShowPropertyData : "show",
                            Error : "hide",
                            ErrorMessage : "",
                            Bedrooms : Bedrooms,
                            Bathrooms : Bathrooms,
                            PropertySize : accounting.formatNumber(PropertySize,0,","),
                            LotSize : accounting.formatNumber(LotSize,0,","),
                            YearBuilt : YearBuilt,
                            Zestimate : accounting.formatNumber(Zestimate,0,","),
                            TaxDeduct : "100",
                            Year : "1",
                            PropertyReset : "show",
                            PropertyInput : "hide"
                          });
      }
      else{
        res.render('index', {Status : "hide-table",
                            ShowPropertyData : "show",
                            Error : "hide",
                            ErrorMessage : "",
                            Bedrooms : Bedrooms,
                            Bathrooms : Bathrooms,
                            PropertySize : accounting.formatNumber(PropertySize,0,","),
                            LotSize : accounting.formatNumber(LotSize,0,","),
                            YearBuilt : YearBuilt,
                            Zestimate : accounting.formatNumber(Zestimate,0,","),
                            PurchasePrice : AskingPrice,
                            PropertyStatus : PropertyStatus,
                            TaxDeduct : "100",
                            Year : "1",
                            PropertyReset : "show",
                            PropertyInput : "hide"
                          });
      }
  }); 

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

  var Bedrooms = req.body.Bedrooms;
  var Bathrooms =req.body.Bathrooms;
  var PropertySize = req.body.PropertySize;
  var LotSize = req.body.LotSize;
  var YearBuilt = req.body.YearBuilt;
  var Zestimate = req.body.Zestimate;
  var ShowPropertyData = req.body.ShowPropertyData; 
  var MakeADeal = req.body.MakeADeal; 
  var BeCareful = req.body.BeCareful;
  //var PropertyReset = req.body.PropertyReset;
  //var PropertyInput = req.body.PropertyInput;

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
  var ReturnStyle = "";

  if(EffectiveReturn < 0){
    ReturnStyle = "bad";
    BeCareful = "show";
    MakeADeal = "hide";
  }
  else if(EffectiveReturn > 15)
  {
    ReturnStyle = "good";
    MakeADeal = "show";
    BeCareful = "hide";
  }

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
                       Status : "show-table",
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
                       EffectiveReturn : accounting.formatNumber(EffectiveReturn,2,","),
                       ReturnStyle : ReturnStyle,
                       Bedrooms : Bedrooms,
                       Bathrooms : Bathrooms,
                       PropertySize : accounting.formatNumber(PropertySize,0,","),
                       LotSize : accounting.formatNumber(LotSize,0,","),
                       YearBuilt : YearBuilt,
                       Zestimate : accounting.formatNumber(Zestimate,0,","),
                       ShowPropertyData : ShowPropertyData,
                       PropertyReset : "show",
                       PropertyInput : "hide",
                       MakeADeal : MakeADeal,
                       BeCareful : BeCareful
                     });
};


