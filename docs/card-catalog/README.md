# Indian credit-card catalog for Pocket

Research checked **9 October 2026 (India)**. **169 named cards / 19 issuers**, comprising **104 benefit summaries** and **65 identity-only records**. This is broad curated coverage, not an audited claim of market majority. Product catalogs can contain legacy cards; catalog presence does not establish new issuance.

- `india-credit-cards.json`: canonical nested catalog, stable card IDs, source registry and benefits.
- `india-credit-cards.csv`: one card per row for reviewing/dropdown import.
- `india-card-benefits.csv`: one benefit per row, including structured fields where researched.
- `catalog.html`: searchable, filterable view of the same data; opens locally without a server.

## What selecting a card should add

Use `id` as the dropdown value and `issuer + name` as the label. Copy sourced benefit descriptions and links into the user’s card. Require confirmation of exact variant/network, billing date and relevant membership. Keep identity-only records selectable as custom/manual setup, explicitly showing that their benefits remain unverified. Do not show empty platform lists as “no benefits”.

All `calculation_ready` flags are **false**. The catalog is suitable for identity selection and displaying researched benefit descriptions, but it is not a complete production calculation database. Numeric research candidates are supplied for selected high-use cards; full MCC/MID exclusions, caps, rounding, dates, refunds and eligibility still require product-level implementation. A null rate/cap means **unknown**, not zero/unlimited. A card name found in issuer documentation is not the same as a verified benefit schedule.

## Current research findings that affect implementation

- **CASHBACK SBI:** official revision effective 1 April 2026 changes the cap to ₹2,000 online + ₹2,000 offline, maximum ₹4,000/statement. An older official PDF still describes ₹5,000; the later revision takes precedence. [Revision](https://www.sbicard.com/cashback-revised).
- **Airtel Axis:** current page shows Airtel/utility caps tied to base cashback and a separate Zomato/Blinkit/District partner value-back scheme. Do not import its older Swiggy/BigBasket scheme. [Current product](https://www.axis.bank.in/cards/credit-card/airtel-axis-bank-credit-card).
- **HSBC Live+:** current product page advertises ₹1,200/month accelerated cashback and an expanded category description; older Visa Cashback material still says ₹1,000. Shopping eligibility requires its current footnotes/service guide. [Current Live+](https://www.hsbc.bank.in/credit-cards/products/live-plus/).
- **Swiggy HDFC:** original, BLCK and ORNGE are separate dropdown identities. The existing owner’s above-₹250 threshold is personal and must not become a public issuer rule. [Current HDFC catalog](https://www.hdfc.bank.in/credit-cards).
- **Flipkart Axis:** separate merchant caps use a **statement quarter**, which differs from a calendar quarter. [Issuer terms](https://www.axis.bank.in/docs/default-source/default-document-library/cashback-tncs---final.pdf?sfvrsn=b55a0e1a_5).
- **Amex:** current issuer pages report a temporary pause on new Indian applications. Existing owners still need exact Platinum Charge/Travel/Reserve selection. [Issuer product page](https://www.americanexpress.com/in/credit-cards/smart-earn-credit-card/).
- **Expired promotions:** Cleartrip/SBI discount PDF expired 30 June 2026, DBS September offers and Axis NEO Dining Delights ending 30 July 2026 were not activated. A live-looking landing page alone does not extend expired terms.

## Benefit model and Pocket compatibility

`cashback`, `instant_discount`, `amazon_pay_balance`, `neucoins`, `membership_rewards`, `cashpoints`, `mycash`, `scapia_coins`, `travel_credits`, vouchers and memberships are distinct. Do not total them as cash automatically. RBL World Safari gift-voucher brands are redemption choices, not bonus-earning merchants. HSBC category benefits need category/MCC matching, not blanket platform matching. SmartBuy, Tripstacc, Unbox, Kiwi and PhonePe rewards need their specified purchase routes.

Pocket’s current `Rule` has cashback/points, a flat cap and statement/month/quarter periods. It cannot directly represent instant coupons, per-use caps, spend-dependent caps, statement quarters, restricted partner currencies, membership eligibility or dated offer validity. Keep this catalog separate from `seed.ts`; add an explicit adapter only for fully implemented supported rules. Snapshot the selected rules on each transaction as the app already does.

When integrating, preserve personal rules and current ledger snapshots. Assign per-user card-instance IDs rather than using one product ID for all owned cards. Shared pools should be keyed by owner/card account and issuer bucket. Record outside-app usage and refunds before estimating remaining caps.

## Maintaining live offers

Maintain temporary campaigns in a separate table with offer ID, eligible/excluded product IDs, merchant, purchase route, coupon/enrolment, start/end timestamps in Asia/Kolkata, minimum spend, maximum discount, frequency, per-user/card scope and source. Unknown validity must disable automated calculation. Review standing benefit terms at least every 30 days and immediately on an issuer notice; review promotions before checkout. This research does not provide a live issuer API/feed.

## Coverage gaps

No weighted market-share completeness measure is available. Some smaller issuers, business/secured products, legacy Citi/Axis migration variants, OneCard partner issuers beyond Federal and network-specific versions need additional entries. Standard Chartered is not included in this pass. Identity-only records and historical summaries explicitly require further verification. Annual fees, interest, lounge quotas and welcome offers are not comprehensively normalized here.

## Full list

### AU Small Finance Bank (7)

- **AU Altura Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.au.bank.in/personal-banking/credit-cards)
- **AU Altura Plus Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.au.bank.in/personal-banking/credit-cards)
- **AU LIT Credit Card** — Selected paid benefit packs. Customisable benefits require the user’s selected active packs; do not assume all packs are enabled. [historical_benefit_summary] [issuer source](https://www.au.bank.in/blogs/au-bank-credit-cards-features-eligibility-charges-benefits)
- **AU Vetta Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.au.bank.in/personal-banking/credit-cards)
- **AU Zenith Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.au.bank.in/personal-banking/credit-cards)
- **AU Zenith+ Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.au.bank.in/personal-banking/credit-cards)
- **ixigo AU Credit Card** — ixigo. Up to 10% discounts on selected ixigo travel bookings; train payment-gateway fee benefit and reward points. [benefit_summary] [issuer source](https://www.au.bank.in/personal-banking/credit-cards/ixigo-au-credit-card)

### American Express India (6)

- **American Express Gold Card** — Amex Offers, RewardXcelerator. Card-specific rewards and offers; check eligibility and enrolment for each promotion. [benefit_summary] [issuer source](https://www.americanexpress.com/en-in/benefits/amex-offers/offers/)
- **American Express Membership Rewards Credit Card** — Amex Offers, RewardXcelerator. Card-specific rewards and offers; check eligibility and enrolment for each promotion. [benefit_summary] [issuer source](https://www.americanexpress.com/en-in/benefits/amex-offers/offers/)
- **American Express Platinum Card** — Amex Offers, RewardXcelerator. Card-specific rewards and offers; check eligibility and enrolment for each promotion. [benefit_summary] [issuer source](https://www.americanexpress.com/en-in/benefits/amex-offers/offers/)
- **American Express Platinum Reserve Credit Card** — Amex Offers, RewardXcelerator. Card-specific rewards and offers; check eligibility and enrolment for each promotion. [benefit_summary] [issuer source](https://www.americanexpress.com/en-in/benefits/amex-offers/offers/)
- **American Express Platinum Travel Credit Card** — Amex Offers, RewardXcelerator. Card-specific rewards and offers; check eligibility and enrolment for each promotion. [benefit_summary] [issuer source](https://www.americanexpress.com/en-in/benefits/amex-offers/offers/)
- **American Express SmartEarn Credit Card** — Amazon, Flipkart, Uber, BookMyShow, Zomato, EaseMyTrip. Accelerated Membership Rewards at eligible named partners. [benefit_summary] [issuer source](https://www.americanexpress.com/in/credit-cards/smart-earn-credit-card/)

### Axis Bank (21)

- **Airtel Axis Bank Credit Card** — Airtel Thanks, Zomato, Blinkit, District Movies. 25% Airtel bills via Thanks capped at 2× same-statement base cashback; utility 10% capped at 1× base. Partner value back is separate. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card/airtel-axis-bank-credit-card)
- **Axis Bank ACE Credit Card** — Google Pay, Swiggy, Zomato, Ola. 5% eligible Google Pay bills/recharges; 4% named partners; 1.5% other eligible spending. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card/axis-bank-ace-credit-card?cta=cc-)
- **Axis Bank ATLAS Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank Cashback Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank Fibe Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank HORIZON Credit Card** — Travel EDGE, Airline websites. 5 EDGE Miles/₹100 on eligible Travel EDGE and airline website spending. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank MAGNUS Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank MAGNUS for Burgundy Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank My Zone Credit Card** — Swiggy, District Movies, Sony LIV, Cleartrip. Swiggy food discount; District movie BOGO; Sony LIV subscription and Cleartrip discounts. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card/axis-bank-my-zone-credit-card)
- **Axis Bank NEO Credit Card** — Zomato, Paytm, Blinkit, BookMyShow, Cleartrip. Zomato ₹120 off twice/month at ₹499 minimum; Paytm bills, Blinkit, movies and Cleartrip have distinct discount terms. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card/axis-bank-neo-credit-card)
- **Axis Bank Privilege Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank RESERVE Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank Rewards Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Axis Bank SELECT Credit Card** — BigBasket, Swiggy, District Movies. BigBasket ₹500 discount at ₹2,500 minimum once/month; Swiggy offer and District movie BOGO. [benefit_summary] [issuer source](https://application.axis.bank.in/app_redirect/redirect.aspx?id=select)
- **Axis Bank super.money RuPay Credit Card** — super.money, Merchant UPI. Advertised 3% cashback for eligible super.money credit-card UPI transactions; app route matters. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card/supermoney-credit-card)
- **Flipkart Axis Bank Credit Card** — Flipkart, Myntra, Cleartrip, Preferred merchants. 5% Flipkart and Cleartrip; 7.5% Myntra; each has its own ₹4,000 statement-quarter cap. Preferred merchants 4%, base eligible 1%. [benefit_summary] [issuer source](https://www.axis.bank.in/docs/default-source/default-document-library/cashback-tncs---final.pdf?sfvrsn=b55a0e1a_5)
- **IndiGo Axis Bank Credit Card** — IndiGo. IndiGo BluChips on eligible spending and tier-specific milestones. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **IndiGo Axis Bank Premium Credit Card** — IndiGo. Higher-tier IndiGo BluChips and travel benefits; confirm Premium variant. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **IndianOil Axis Bank Credit Card** — IndianOil. Accelerated fuel reward value at IndianOil; reward points and surcharge waiver are distinct. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card)
- **Samsung Axis Bank Infinite Credit Card** — Samsung, BigBasket, Tata 1mg, Urban Company, Myntra, Zomato. Samsung cashback and partner points; Infinite caps must be checked separately from Signature. [historical_benefit_summary] [issuer source](https://www.axis.bank.in/about-us/press-releases/samsung-india-axis-bank-launch-co-branded-credit-card-powered-by-visa-now-get-10-cashback-on-samsung-products-services)
- **Samsung Axis Bank Signature Credit Card** — Samsung, BigBasket, Tata 1mg, Urban Company, Myntra, Zomato. Samsung cashback and accelerated EDGE points at preferred partners; separate buckets. [benefit_summary] [issuer source](https://www.axis.bank.in/cards/credit-card/samsung-axis-bank-signature-credit-card)

### BOBCARD (7)

- **BOBCARD Easy** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.bobcard.co.in/compare-cards)
- **BOBCARD Eterna** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.bobcard.co.in/compare-cards)
- **BOBCARD Premier** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.bobcard.co.in/compare-cards)
- **BOBCARD Tiara** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.bobcard.co.in/compare-cards)
- **HPCL ENERGIE BOBCARD** — HPCL. Fuel-focused rewards and surcharge waiver; separate components and limits need verification. [benefit_summary] [issuer source](https://www.bobcard.co.in/)
- **IRCTC BOBCARD** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.bobcard.co.in/compare-cards)
- **Snapdeal BOBCARD** — Snapdeal. Advertised 5% cashback on eligible Snapdeal shopping. [benefit_summary] [issuer source](https://www.bobcard.co.in/)

### Bank of India (1)

- **Bank of India RuPay Select Credit Card** — RuPay Select benefits portal. Network lifestyle and lounge benefits require registration and current network eligibility. [benefit_summary] [issuer source](https://bankofindia.bank.in/credit-card/rupay-select)

### Canara Bank (3)

- **Canara Bank RuPay Classic Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://canarabank.com/UploadedFiles/Pdf/Credit%20card%20variants%20and%20features-updated%2016.03.2024.pdf)
- **Canara Bank RuPay Platinum Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://canarabank.com/UploadedFiles/Pdf/Credit%20card%20variants%20and%20features-updated%2016.03.2024.pdf)
- **Canara Bank RuPay Select Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://canarabank.com/UploadedFiles/Pdf/Credit%20card%20variants%20and%20features-updated%2016.03.2024.pdf)

### DBS Bank India (1)

- **DBS Spark Credit Card** — DBS Delights. Tier-dependent Cash Point multipliers and rewards/redemption via DBS Delights. [benefit_summary] [issuer source](https://www.dbs.bank.in/in/credit-cards/spark.html)

### Federal Bank (5)

- **Federal Bank Celesta Credit Card** — INOX, FedDelights. INOX movie BOGO, dining privileges and category points. [benefit_summary] [issuer source](https://www.federal.bank.in/-/credit-card-17)
- **Federal Bank Imperio Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.federal.bank.in/compare-credit-cards)
- **Federal Bank OneCard** — OneCard app, Top spending categories. Points and 5× top-two-category rewards subject to the monthly qualifying-category rule. [benefit_summary] [issuer source](https://getonecard.app/legal/fed_mitc/)
- **Federal Bank Signet Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.federal.bank.in/compare-credit-cards)
- **Scapia Federal Bank Credit Card** — Scapia. Coins on eligible spends and accelerated Scapia travel bookings; Visa and RuPay have different schedules. [benefit_summary] [issuer source](https://www.federal.bank.in/scapia)

### HDFC Bank (23)

- **HDFC Bank Diners Club Black Credit Card** — SmartBuy. SmartBuy accelerated rewards and lifestyle memberships; verify original variant. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **HDFC Bank Diners Club Black Metal Edition Credit Card** — SmartBuy. SmartBuy rewards, travel privileges and quarterly spending milestones. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **HDFC Bank Diners Club Privilege Credit Card** — Swiggy, Zomato, BookMyShow, SmartBuy. 5× points on eligible food orders; weekend movie BOGO with limits; route-specific SmartBuy points. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/diners-privilege-credit-card)
- **HDFC Bank Freedom Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **HDFC Bank INFINIA Metal Edition Credit Card** — SmartBuy, Club Marriott, ITC Hotels. SmartBuy rewards and hotel/dining privileges; portal rules and membership conditions apply. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **HDFC Bank Millennia Credit Card** — Amazon, BookMyShow, Cult.fit, Flipkart, Myntra, Sony LIV, Swiggy, Tata CLiQ, Uber, Zomato. 5% in CashPoints at ten named merchants; 1% other eligible purchases. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/millennia-credit-card)
- **HDFC Bank MoneyBack Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **HDFC Bank MoneyBack+ Credit Card** — Amazon, Flipkart, Swiggy, Reliance Smart SuperStore, BigBasket, Swiggy Dineout. 10× CashPoints at named partners; base CashPoints and separate Dineout discount. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/moneyback-plus-credit-card)
- **HDFC Bank PIXEL Go Credit Card** — Swiggy Dineout, Eligible purchases. Cashback and partner dining offer; validate current terms before displaying a discount amount. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **HDFC Bank PIXEL Play Credit Card** — Selected category packs, BookMyShow, MakeMyTrip, Zomato. Up to 5% cashback in selected packs; choice of pack determines merchants. [benefit_summary] [issuer source](https://v.hdfc.bank.in/pixel-credit-card/index.html)
- **HDFC Bank Regalia Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **HDFC Bank Regalia Gold Credit Card** — Myntra, Nykaa, Reliance Digital, SmartBuy. 5× points at selected brands; SmartBuy route bonuses and spend milestones. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/regalia-gold-credit-card)
- **HDFC Bank UPI RuPay Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **IRCTC HDFC Bank Credit Card** — IRCTC, IRCTC Rail Connect, SmartBuy. 5 points/₹100 eligible IRCTC ticketing; separate SmartBuy booking benefit and transaction-charge waiver. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/irctc-credit-card)
- **IndianOil HDFC Bank Credit Card** — IndianOil, Eligible grocery, Eligible utilities. Accelerated Fuel Points at IndianOil and selected categories; separate surcharge waiver. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/indianoil-hdfc-bank-credit-card)
- **Marriott Bonvoy HDFC Bank Credit Card** — Marriott Bonvoy, Eligible travel, Eligible dining, Eligible entertainment. Marriott Bonvoy points on participating hotel purchases and selected categories; tier/status benefits. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/marriott-bonvoy-credit-card)
- **PhonePe HDFC Bank Ultimo Credit Card** — PhonePe, Amazon, Flipkart, Myntra, Merchant UPI. Advertised 10% rewards on selected PhonePe categories; online-brand and UPI rewards have separate rules. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/phonepe-hdfc-bank-ultimo-credit-card)
- **PhonePe HDFC Bank Uno Credit Card** — PhonePe, Amazon, Flipkart, Myntra, Merchant UPI. Advertised 2% rewards on selected PhonePe categories; online-brand and UPI rewards have separate rules. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/phonepe-hdfc-bank-uno-credit-card)
- **Swiggy BLCK HDFC Bank Credit Card** — Swiggy Food, Swiggy Instamart, Swiggy Dineout, Eligible online shopping. 10% eligible Swiggy cashback, 5% selected online, 1% other eligible spends; introductory BLCK membership. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/swiggy-blck-hdfc-bank-credit-card)
- **Swiggy HDFC Bank Credit Card** — Swiggy Food, Swiggy Instamart, Swiggy Dineout, Eligible online shopping. 10% eligible Swiggy cashback; 5% eligible online; 1% other eligible spending. [benefit_summary] [issuer source](https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/swiggy-hdfc-bank-credit-card/pdf/terms-and-conditions-swiggy-hdfc-bank-credit-card-26052026.pdf)
- **Swiggy ORNGE HDFC Bank Credit Card** — Swiggy, Eligible online shopping. 5% on eligible Swiggy and selected online spending; 1% other eligible spends; activation membership. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards)
- **Tata Neu Infinity HDFC Bank Credit Card** — Tata Neu, BigBasket, Croma, Tata CLiQ, Tata 1mg, Westside, Taj, Titan, Tanishq, Qmin. 5% NeuCoins on eligible Tata partner purchases; 1.5% other eligible non-UPI spends; selected NeuPass purchases can earn a separate bonus. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/tata-neu-infinity-hdfc-bank-credit-card)
- **Tata Neu Plus HDFC Bank Credit Card** — Tata Neu, BigBasket, Croma, Tata CLiQ, Tata 1mg, Westside, Taj, Titan, Tanishq, Qmin. 2% NeuCoins on eligible Tata partner purchases; 1% other eligible non-UPI spends; selected NeuPass purchases can earn a separate bonus. [benefit_summary] [issuer source](https://www.hdfc.bank.in/credit-cards/tata-neu-plus-hdfc-bank-credit-card)

### HSBC India (6)

- **HSBC Live+ Credit Card** — Eligible dining, Eligible food delivery, Eligible grocery, Eligible shopping, Eligible utilities. Current product page advertises 10% in selected categories up to ₹1,200/month; 1.5% other eligible spending. [benefit_summary] [issuer source](https://www.hsbc.bank.in/credit-cards/products/live-plus/)
- **HSBC Premier Credit Card** — HSBC rewards, Apple online store, Selected airline partners. Reward-point redemption and partner transfer privileges. [benefit_summary] [issuer source](https://www.hsbc.bank.in/credit-cards/compare/)
- **HSBC RuPay Cashback Credit Card** — Eligible dining, Eligible food delivery, Eligible grocery, Merchant UPI. 10% selected food/grocery categories; 1% other eligible spending; page advertises up to ₹400/month. [benefit_summary] [issuer source](https://www.hsbc.bank.in/credit-cards/products/rupay-cashback-credit-card/)
- **HSBC Taj Credit Card** — Taj, SeleQtions, Gateway, Vivanta, amã Stays & Trails. Taj-family stay and dining privileges; membership/tier terms apply. [benefit_summary] [issuer source](https://www.hsbc.bank.in/credit-cards/compare/)
- **HSBC TravelOne Credit Card** — HSBC Travel with Points, Eligible travel, Airline/hotel transfer partners. Travel reward points, booking-route accelerators and points transfers. [benefit_summary] [issuer source](https://www.hsbc.bank.in/credit-cards/products/travelone/)
- **HSBC Visa Platinum Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.hsbc.bank.in/credit-cards/compare/)

### ICICI Bank (15)

- **Adani One ICICI Bank Platinum Credit Card** — Adani One, BookMyShow. Adani ecosystem rewards and tier-specific airport/movie benefits. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/blogs/card/credit-card/travel-credit-card)
- **Adani One ICICI Bank Signature Credit Card** — Adani One, Adani-managed airports, Trainman, Adani Gas, Adani Electricity, BookMyShow. Adani ecosystem reward points, airport-service privileges and conditional movie offer. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/adani-icici-credit-card/signature-credit-card)
- **Amazon Pay ICICI Bank Credit Card** — Amazon India, Amazon Pay partner checkout. 5% eligible Amazon for Prime, 3% non-Prime; 2% eligible Amazon Pay partner checkout; 1% other eligible spends. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/amazon-pay-credit-card)
- **Emirates Skywards ICICI Bank Emeralde Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.icici.bank.in/personal-banking/blogs/card/credit-card/travel-credit-card)
- **Emirates Skywards ICICI Bank Rubyx Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.icici.bank.in/personal-banking/blogs/card/credit-card/travel-credit-card)
- **Emirates Skywards ICICI Bank Sapphiro Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.icici.bank.in/personal-banking/blogs/card/credit-card/travel-credit-card)
- **HPCL Super Saver ICICI Bank Credit Card** — HPCL, HP Pay, BookMyShow, INOX. Advertised fuel savings combine cashback and surcharge waiver; separate movie discounts. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/hpcl-super-saver)
- **ICICI Bank Coral Credit Card** — BookMyShow. Variant-specific BookMyShow discount/BOGO and eligible retail reward points. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/experience/bookmyshow-tnc)
- **ICICI Bank Diamant Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.icici.bank.in/personal-banking/blogs/card/credit-card/travel-credit-card)
- **ICICI Bank Emeralde Credit Card** — BookMyShow. BookMyShow second-ticket discount up to ₹750, up to four/month; preceding-quarter spend condition applies. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/emeralde-credit-card)
- **ICICI Bank Emeralde Private Metal Credit Card** — BookMyShow, EaseMyTrip. BookMyShow BOGO up to ₹750 twice/month; EaseMyTrip milestone vouchers and retail points. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/emeralde-private-metal-credit-card)
- **ICICI Bank Rubyx Credit Card** — BookMyShow. Variant-specific BookMyShow discount/BOGO and eligible retail reward points. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/experience/bookmyshow-tnc)
- **ICICI Bank Sapphiro Credit Card** — BookMyShow. Variant-specific BookMyShow discount/BOGO and eligible retail reward points. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/experience/bookmyshow-tnc)
- **ICICI Bank Times Black Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.icici.bank.in/personal-banking/blogs/card/credit-card/travel-credit-card)
- **MakeMyTrip ICICI Bank Credit Card** — MakeMyTrip, BookMyShow, INOX. Up to 6% myCash on eligible MakeMyTrip bookings; travel and conditional movie benefits. [benefit_summary] [issuer source](https://www.icici.bank.in/personal-banking/cards/credit-card/makemytrip/makemytrip-icici-bank-credit-card)

### IDFC FIRST Bank (12)

- **HPCL IDFC FIRST Power Credit Card** — HPCL, HP Pay, IDFC FIRST FASTag. Fuel and selected-category reward points; use Power terms rather than Power+. [historical_benefit_summary] [issuer source](https://www.idfcfirst.bank.in/finfirst-blogs/credit-card/benefits-of-first-power-and-first-power-plus)
- **HPCL IDFC FIRST Power+ Credit Card** — HPCL, HP Pay, IDFC FIRST FASTag, FIRST Rewards Gallery. Accelerated fuel, grocery, utility and FASTag points; HP Pay benefits have separate conditions. [benefit_summary] [issuer source](https://www.idfcfirst.bank.in/credit-card/hpcl-power-fuel-credit-card)
- **IDFC FIRST Bank Ashva Credit Card** — FIRST Rewards / Tripstacc. Variant-specific bonus points for flights and hotels through the designated booking flow. [benefit_summary] [issuer source](https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/credit-card/Terms-and-Conditions-Tripstacc.pdf)
- **IDFC FIRST Bank FIRST Classic Credit Card** — FIRST Rewards / Tripstacc. Variant-specific bonus points for flights and hotels through the designated booking flow. [benefit_summary] [issuer source](https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/credit-card/Terms-and-Conditions-Tripstacc.pdf)
- **IDFC FIRST Bank FIRST EA₹N Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.idfcfirst.bank.in/credit-card/benefits/forex-mark-up)
- **IDFC FIRST Bank FIRST Millennia Credit Card** — FIRST Rewards / Tripstacc. Variant-specific bonus points for flights and hotels through the designated booking flow. [benefit_summary] [issuer source](https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/credit-card/Terms-and-Conditions-Tripstacc.pdf)
- **IDFC FIRST Bank FIRST Select Credit Card** — FIRST Rewards / Tripstacc. Variant-specific bonus points for flights and hotels through the designated booking flow. [benefit_summary] [issuer source](https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/credit-card/Terms-and-Conditions-Tripstacc.pdf)
- **IDFC FIRST Bank FIRST WOW! Black Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.idfcfirst.bank.in/credit-card/benefits/forex-mark-up)
- **IDFC FIRST Bank FIRST WOW! Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.idfcfirst.bank.in/credit-card/benefits/forex-mark-up)
- **IDFC FIRST Bank FIRST Wealth Credit Card** — FIRST Rewards / Tripstacc. Variant-specific bonus points for flights and hotels through the designated booking flow. [benefit_summary] [issuer source](https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/credit-card/Terms-and-Conditions-Tripstacc.pdf)
- **IDFC FIRST Bank Hello Cashback Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.idfcfirst.bank.in/credit-card/benefits/forex-mark-up)
- **IDFC FIRST Bank Mayura Credit Card** — FIRST Rewards / Tripstacc. Variant-specific bonus points for flights and hotels through the designated booking flow. [benefit_summary] [issuer source](https://www.idfcfirst.bank.in/content/dam/idfcfirstbank/pdf/credit-card/Terms-and-Conditions-Tripstacc.pdf)

### IndusInd Bank (6)

- **EazyDiner IndusInd Bank Platinum Credit Card** — EazyDiner PayEazy. Extra 20% discount up to ₹500, three times/calendar month at eligible PayEazy restaurants. [benefit_summary] [issuer source](https://www.indusind.bank.in/in/en/personal/tnc-extra-20-off.html)
- **EazyDiner IndusInd Bank Signature Credit Card** — EazyDiner PayEazy. Extra dining discount up to 25%/₹1,000 via PayEazy; current usage and membership conditions need confirmation. [benefit_summary] [issuer source](https://www.indusind.bank.in/iblogs/credit-card/dining-credit-cards-in-india/)
- **IndusInd Bank Avios Visa Infinite Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.indusind.bank.in/in/en/personal/cards.html)
- **IndusInd Bank Legend Credit Card** — BookMyShow. Movie BOGO capped at ₹200, one free ticket/month under the December 2025 benefit guide. [benefit_summary] [issuer source](https://www.indusind.bank.in/content/dam/indusind-corporate/Other/welcomekit/credit-card-benefits/Legend_Benefit_Guide_19-12-2025.pdf)
- **IndusInd Bank Pinnacle Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.indusind.bank.in/in/en/personal/cards.html)
- **IndusInd Bank Tiger Credit Card** — BookMyShow. One complimentary movie ticket up to ₹500 every six months in a calendar year. [benefit_summary] [issuer source](https://www.indusind.bank.in/in/en/personal/tnc-tiger-credit-card-entertainment.html)

### Kotak Mahindra Bank (11)

- **IndianOil Kotak Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/kfs.html)
- **Kotak Air Credit Card** — Kotak Unbox. Air Miles for eligible Unbox travel bookings and other purchases. [benefit_summary] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards.html)
- **Kotak Air+ Credit Card** — Kotak Unbox. 5 Air Miles/₹100 eligible Unbox flight/hotel booking; 2 miles/₹100 other eligible purchases. [benefit_summary] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/kotak-air-plus-credit-card/value.html)
- **Kotak Cashback+ Credit Card** — Eligible online food delivery, Eligible grocery, Eligible entertainment, Fuel. 5% selected online food/grocery/entertainment; 3% fuel; 0.5% other eligible spending. [benefit_summary] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards.html)
- **Kotak League Platinum Credit Card** — PVR. Spend milestone choice includes PVR tickets or points; general reward points. [benefit_summary] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards.html)
- **Kotak Mojo Platinum Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/kfs.html)
- **Kotak White Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/kfs.html)
- **Kotak White Reserve Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/kfs.html)
- **Kotak Zen Signature Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/kfs.html)
- **Myntra Kotak Credit Card** — Myntra, Swiggy, Swiggy Instamart, Cleartrip, PVR, Urban Company. 7.5% Myntra instant discount up to ₹750/transaction; 5% partner cashback in a ₹1,000 billing-cycle pool; 1.25% other eligible. [benefit_summary] [issuer source](https://www.kotak.bank.in/en/get-help/myntra-kotak-credit-card-faq.html)
- **PVR INOX Kotak Credit Card** — PVR INOX. Movie tickets earned through monthly spend milestones; separate ticket and food discounts. [benefit_summary] [issuer source](https://www.kotak.bank.in/en/personal-banking/cards/credit-cards/pvr-inox-kotak-credit-card.html?tabName=welcome-benefits)

### Punjab National Bank (2)

- **PNB RuPay Platinum Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.pnbindia.in/PreQualified-Credit-Card.html)
- **PNB RuPay Select Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.pnbindia.in/PreQualified-Credit-Card.html)

### RBL Bank (6)

- **IRCTC RBL Bank Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.rbl.bank.in/personal-banking/cards/credit-cards/category)
- **IndianOil RBL Bank Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.rbl.bank.in/personal-banking/cards/credit-cards/category)
- **IndianOil RBL Bank XTRA Credit Card** — IndianOil. Fuel-focused rewards; confirm XTRA tier and fuel transaction conditions. [benefit_summary] [issuer source](https://www.rbl.bank.in/personal-banking/cards/credit-cards/indianoil-rbl-bank-xtra-credit-card?tabName=welcome-benefits)
- **RBL Bank Play Credit Card** — BookMyShow. BookMyShow movie and food/beverage benefits, with spend eligibility. [benefit_summary] [issuer source](https://www.rbl.bank.in/personal-banking/cards/credit-cards/rbl-bank-play-credit-card)
- **RBL Bank ShopRite Credit Card** — BookMyShow, Eligible grocery. Grocery reward points and BookMyShow ticket discount. [benefit_summary] [issuer source](https://www.rbl.bank.in/personal-banking/cards/credit-cards/shoprite-credit-card?tabName=welcome-benefits)
- **RBL Bank World Safari Credit Card** — RBL travel redemption, Taj, Amazon, Croma, Myntra, MakeMyTrip. Travel points and milestone gift voucher choices. Voucher brands are redemption destinations. [benefit_summary] [issuer source](https://www.rbl.bank.in/personal-banking/cards/credit-cards/world-safari-credit-card)

### SBI Card (28)

- **Air India SBI Platinum Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page) · [issuer source](https://www.sbicard.com/en/customer-notices.page)
- **Air India SBI Signature Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page) · [issuer source](https://www.sbicard.com/en/customer-notices.page)
- **Apollo SBI Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **Apollo SBI Card SELECT** — Apollo 24x7, Apollo Pharmacy, Apollo Diagnostics, Apollo Medical Centres. Apollo discounts, reward points and Health Credits; Health Credits are restricted ecosystem value. [benefit_summary] [issuer source](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/tnc/Apollo-SBI-Card-SELECT-FAQ.pdf)
- **BPCL SBI Card** — BPCL. BPCL reward points and fuel surcharge waiver; OCTANE has a separate reward schedule. [benefit_summary] [issuer source](https://www.sbicard.com/en/personal/credit-cards/bpcl-sbi-card.html)
- **BPCL SBI Card OCTANE** — BPCL, Bharat Gas, Eligible dining, Eligible grocery, Eligible movies. 25 points/₹100 BPCL fuel; separate Bharat Gas and category buckets; surcharge waiver is distinct. [benefit_summary] [issuer source](https://www.sbicard.com/en/personal/credit-cards/bpcl-sbi-card-octane.html)
- **CASHBACK SBI Card** — Eligible online merchants, Eligible offline merchants. 5% eligible online and 1% eligible offline cashback. From 1 April 2026: ₹2,000 cap per bucket and ₹4,000 combined per statement. [benefit_summary] [issuer source](https://www.sbicard.com/cashback-revised)
- **Flipkart SBI Card** — Flipkart, Myntra, Cleartrip. 5% eligible Flipkart cashback; 7.5% Myntra. Cleartrip promotional claims need expiry verification. [benefit_summary] [issuer source](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/ekit-tncs/Flipkart-SBI-CreditCard-TandC-Booklet.pdf)
- **Google Pay Flex SBI Card** — Google Pay. Google Pay Stars and product-specific reward/activation benefits. [benefit_summary] [issuer source](https://www.sbicard.com/)
- **IRCTC SBI Card** — IRCTC. Up to 10% value in reward points on eligible IRCTC bookings, with eligible class/route restrictions. [benefit_summary] [issuer source](https://www.sbicard.com/en/personal/credit-cards/travel/irctc-rupay-sbi-card.page)
- **IRCTC SBI Card Premier** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **IndiGo SBI Card** — IndiGo. IndiGo BluChips, travel privileges and spending milestones. [benefit_summary] [issuer source](https://www.sbicard.com/)
- **IndiGo SBI Card ELITE** — IndiGo. IndiGo BluChips, additional travel privileges and spending milestones. Confirm ELITE tier. [benefit_summary] [issuer source](https://www.sbicard.com/)
- **KrisFlyer SBI Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **KrisFlyer SBI Card APEX** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **PhonePe SBI Card PURPLE** — PhonePe, Pincode, Eligible online merchants. Up to 3% advertised value in reward points on eligible PhonePe/Pincode spending; separate online and base rewards. [benefit_summary] [issuer source](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/who-we-are/notices/SEFilingPressReleaseJuly2025.pdf)
- **PhonePe SBI Card SELECT BLACK** — PhonePe, Pincode, Eligible online merchants. Up to 10% advertised value in reward points on eligible PhonePe/Pincode spending; separate online and base rewards. [benefit_summary] [issuer source](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/who-we-are/notices/SEFilingPressReleaseJuly2025.pdf)
- **SBI Card AURUM** — BookMyShow, AURUM memberships. Monthly movie tickets and curated lifestyle/travel memberships; verify each membership offer. [benefit_summary] [issuer source](https://www.sbicard.com/aurum/benefits.html)
- **SBI Card ELITE** — BookMyShow. Primary-card BookMyShow movie benefit; select the eligible SBI ELITE offer. [benefit_summary] [issuer source](https://www.sbicard.com/en/faq/card-upgrade-process.page)
- **SBI Card MILES** — Eligible travel, SBI rewards redemption. Travel Credits on eligible travel and retail spending; transfer/redemption options. [benefit_summary] [issuer source](https://www.sbicard.com/en/personal/credit-cards/sbi-card-miles.html)
- **SBI Card MILES ELITE** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **SBI Card MILES PRIME** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **SBI Card PRIME** — Eligible dining, Eligible grocery, Eligible movies, Eligible utility standing instructions. Accelerated category reward points and spend milestones; general category rewards, not a named-app offer. [benefit_summary] [issuer source](https://www.sbicard.com/en/personal/credit-cards/sbi-card-prime.html)
- **SBI Card PULSE** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **SimplyCLICK SBI Card** — Apollo 24x7, BookMyShow, Cleartrip, Domino’s, IGP, Myntra, Netmeds, Swiggy, Yatra, GyFTR, Tata CLiQ. Partner points and online rewards; Swiggy multiplier conflicts between current product page and dated customer notice. [conflicting_issuer_sources] [issuer source](https://www.sbicard.com/en/personal/credit-cards/simplyclick-sbi-card.html) · [issuer source](https://www.sbicard.com/en/customer-notices.page)
- **SimplySAVE SBI Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://www.sbicard.com/en/most-important-terms-and-conditions.page)
- **Tata Neu Infinity SBI Card** — Tata Neu, BigBasket, Croma, Tata CLiQ, Tata 1mg, Air India, Air India Express, Taj, Titan, Tanishq, Westside, Qmin. 5% NeuCoins on eligible Tata partner non-EMI transactions; separate non-Tata and RuPay UPI rewards. [benefit_summary] [issuer source](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/who-we-are/notices/SEFilingPressrelease-apr25.pdf)
- **Tata Neu Plus SBI Card** — Tata Neu, BigBasket, Croma, Tata CLiQ, Tata 1mg, Air India, Air India Express, Taj, Titan, Tanishq, Westside, Qmin. 2% NeuCoins on eligible Tata partner non-EMI transactions; separate non-Tata and RuPay UPI rewards. [benefit_summary] [issuer source](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/who-we-are/notices/SEFilingPressrelease-apr25.pdf)

### Union Bank of India (3)

- **Union Bank RuPay Platinum Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://unioncards.unionbankofindia.co.in/access/smsService%21go.action)
- **Union Bank RuPay Select Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://unioncards.unionbankofindia.co.in/access/smsService%21go.action)
- **Union UNI CARBON Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://unioncards.unionbankofindia.co.in/access/smsService%21go.action)

### YES BANK (6)

- **YES BANK Klick RuPay Credit Card** — Kiwi, Merchant UPI. Kiwi-linked card; rewards depend on current Kiwi plan, route and promotion. [benefit_summary] [issuer source](https://gokiwi.in/terms-and-conditions/flights/)
- **YES BANK MARQUEE Credit Card** — BookMyShow, YES Rewardz. Movie BOGO, online points and travel privileges; verify current eligibility and caps. [benefit_summary] [issuer source](https://www.yes.bank.in/content/published/api/v1.1/assets/CONT8A070F73DE3E4A338CB32A9D90F5E1B3/native/yes_first_schedule_of_charges_1st_oct25.pdf?channelToken=21f7ccfa2fc3401091938f541a6f8f2a&download=false)
- **YES BANK POP-CLUB Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://quickapply.yesbank.in/savings/assets/files/yesbank_key_fact_statement.pdf)
- **YES BANK Paisabazaar Paisasave Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://quickapply.yesbank.in/savings/assets/files/yesbank_key_fact_statement.pdf)
- **YES BANK RESERV Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://quickapply.yesbank.in/savings/assets/files/yesbank_key_fact_statement.pdf)
- **YES BANK Uni Credit Card** — Platform benefits not yet verified. Product name found in issuer catalog; platform benefits need product-level verification. [catalog_only] [issuer source](https://quickapply.yesbank.in/savings/assets/files/yesbank_key_fact_statement.pdf)


## Pocket integration (10 October 2026)

Pocket imports all 169 identities, benefit summaries, conditions, sources and checked dates through `lib/pocket/card-catalog.ts`. The card editor is loaded on demand; each selected card receives a separate account-owned copy. Editing the catalogue does not silently rewrite existing user cards or transaction reward snapshots.

Reviewed calculation adapters currently cover standard Swiggy HDFC, HSBC RuPay Cashback, HSBC Live+, Flipkart Axis, CASHBACK SBI, Myntra Kotak, Axis ACE, Amazon Pay ICICI, ICICI Coral and HDFC Infinia Metal. Other catalogue products import their available benefits but explicitly require manual reward setup. Null caps in research data are **not** interpreted as unlimited. Free-form summaries are never parsed into executable reward rules. Unknown cards must not invent cashback.

Custom rules support exact merchant names and account platform IDs, categories/exclusions, online/offline channels, minimum spend, per-purchase caps, validity dates, shared billing/month/statement-quarter caps, points and store credits. An imported rule applies only to recorded merchant/category/channel information; MCCs, EMI and route-specific eligibility cannot be inferred from a platform name. Users must record the appropriate excluded category for ineligible purchases. Coupons and instant discounts remain informational benefits, separate from earned cashback. Amazon Pay rewards are store credit; Prime membership is an explicit choice.

Existing owner Swiggy >₹250 and HSBC personal shopping overrides remain unchanged. Newly selected Swiggy cards use catalogue issuer terms and issuer whole-rupee rounding; they do not inherit the owner’s personal minimum. Outside-Pocket usage is editable separately for each capped bucket. Statement day is needed for accurate cycle estimates. Historical entries retain their captured rules; changing the transaction date or payment/platform chooses current rules again.

Verification: `tests/card-catalog.test.ts` validates every imported record plus product rules, shared/independent caps, channel exclusions, statement-quarter boundaries, Prime credit, unknown-product behavior and preservation of owner settings.
