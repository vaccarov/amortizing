# Amortizing

A real estate loan amortization calculator. It computes monthly payments, generates an amortization schedule, and calculates financial indicators (APR, IRR, TRI) for investment property loans.

## Loan parameters

| Parameter | Description |
|-----------|-------------|
| Start date | First payment date |
| Loan amount | Total amount borrowed |
| Annual rate | Nominal annual interest rate |
| Duration | Loan term in months |
| Insurance | Monthly insurance rate applied to the loan |
| Grace period | Months with interest-only payments before amortization begins |
| Gross yield | Annual rental yield before expenses |
| Tax rate | Marginal tax rate (%) |
| Annual appreciation | Expected yearly property value change |

## Upfront fees

| Fee | Description |
|-----|-------------|
| Guarantee fee | Loan guarantee/collateral fee |
| Processing fee | Bank processing fee |
| Broker fee | Mortgage broker commission |

## Indicators

- **APR (w/ insurance)** — Annual Percentage Rate including insurance
- **APR (w/o insurance)** — APR excluding insurance
- **AIR** — Annual Interest Rate (actuarial)
- **TRI** — Internal Rate of Return on the investment
- **Monthly payment** — Principal + interest (without insurance)
- **Total cost** — Total interest + insurance + upfront fees
- **Future value** — Projected property value at end of term
- **Monthly rent** — Estimated net rent (80% of gross yield)

## Usage

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
