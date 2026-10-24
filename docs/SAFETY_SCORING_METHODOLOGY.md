# RouteShield — Safety Scoring Methodology & Formula Specification

## 1. Core Principles

1. **No Fabricated Data:** If municipal or OpenStreetMap datasets for street lighting, verified hazards, or pedestrian paths are not present in a given region, RouteShield **never** assigns an arbitrary score. It explicitly returns:
   > `status: "INSUFFICIENT_DATA"` ("Insufficient safety data / Safety data unavailable")
2. **Absence of Evidence is not Evidence of Safety:** A lack of community incident reports in an area is never interpreted as proof that a route is safe. Reporting rates depend on local population density, smartphone adoption, and awareness.
3. **No Safety Guarantees:** A route evaluation is strictly an informative infrastructure assessment based on verified data points. RouteShield displays a mandatory disclaimer:
   > *"Safety evaluations are estimates based on available verified datasets and do not guarantee personal safety."*

---

## 2. Mathematical Formulation

Let a route $R$ be defined as a polyline sequence of coordinates $C = \{(lng_i, lat_i)\}_{i=1}^N$ with total navigable distance $D$ (in meters).
The route corridor is defined as the buffer zone $B(R, r)$ where $r = 40\text{ meters}$.

The Composite Estimated Safety Indicator (ESI) is computed as:

$$\text{ESI} = w_S \cdot S + w_P \cdot P + w_H \cdot H + w_F \cdot F$$

Where weights satisfy $\sum w_i = 1.0$:

| Factor | Notation | Configured Weight ($w_i$) | Evaluation Method |
| :--- | :--- | :--- | :--- |
| **Street Lighting Density** | $S$ | **0.35 (35%)** | Density of verified lit nodes per km along $B(R, 40\text{m})$. $S = \min\left(100, \frac{\text{Lights}}{D/1000} \times 15\right)$ |
| **Pedestrian Infrastructure** | $P$ | **0.25 (25%)** | Designated footpaths, separated cycleways, signalized crosswalks |
| **Verified Hazard Deductions** | $H$ | **0.25 (25%)** | Penalty of 20 points per active verified hazard within corridor. $H = \max\left(10, 100 - (20 \times \text{Hazards})\right)$ |
| **Data Freshness & Density** | $F$ | **0.15 (15%)** | Age of surveyed nodes and observation confidence |

---

## 3. Data Completeness & Cutoff Threshold

Before computing ESI, RouteShield calculates the spatial observation density ratio:

$$\text{Coverage Ratio} = \min\left(1.0, \frac{\text{Surveyed Nodes}}{\max\left(2, \lfloor D / 250 \rfloor\right)}\right)$$

- If $\text{Coverage Ratio} < 0.30$ (30% threshold), the calculation halts.
- The response sets $\text{score} = \text{null}$ and outputs the explanation:
  `"Available open safety datasets and municipal surveys are insufficient for this specific route. RouteShield does not fabricate scores when data is missing."`
