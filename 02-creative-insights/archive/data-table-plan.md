# Plan: Integrate Admin Data Tables into Enhanced App Features

## Objective
Apply the same data table integration updates made in jpmc-app to the enhanced-app codebase. This ensures that the AudienceGenerator, ESpots, PDPPersonalization (Content Studio), and SyntheticTesting (Focus Group) components dynamically use data configured via the Admin panel data tables.

## Key Files & Context
- enhanced-app/components/AudienceGenerator.tsx
- enhanced-app/components/ESpots.tsx
- enhanced-app/components/PDPPersonalization.tsx
- enhanced-app/components/SyntheticTesting.tsx
- enhanced-app/public/data/configuration/ (New JSON files)

## Implementation Steps

### 1. Update AudienceGenerator.tsx
- **Objective:** Replace the hardcoded SAMPLE_CUSTOMER_DATA with data fetched dynamically from the active data table configuration.
- **Actions:**
  - Add customerData state: const [customerData, setCustomerData] = useState<any[]>([]);
  - Implement a useEffect to fetch /data/configuration/microsite_sample_data.json on component mount. Fallback to SAMPLE_CUSTOMER_DATA if the fetch fails or data is empty.
  - Update the handleGenerate function to use customerData instead of SAMPLE_CUSTOMER_DATA for the Gemini prompt context.
  - Update the table rendering logic in the UI to dynamically loop through Object.keys(customerData[0]) for headers and Object.values(customer) for rows, instead of hardcoded columns (Name, Category, Top Channel, etc.). Only show the first ~5 keys/values.

### 2. Update ESpots.tsx
- **Objective:** Replace the static consumerData array with data from the Admin data tables.
- **Actions:**
  - Remove the hardcoded const consumerData = [...] definition.
  - Add consumerData state: const [consumerData, setConsumerData] = useState<any[]>([]);
  - Implement a useEffect to fetch /data/configuration/microsite_sample_data.json and update state.
  - Update the table rendering in Step 1 to dynamically render headers from Object.keys(consumerData[0]) (excluding id and user_id) and values from Object.entries(user), ensuring it aligns with the fetched JSON structure.

### 3. Update PDPPersonalization.tsx (Content Studio)
- **Objective:** Ensure the Content Studio reflects the custom audiences configured in the data tables.
- **Actions:**
  - Inside the loadAudiences useEffect, update the data fetching logic to pull standard audiences from /data/configuration/standard_audiences.json.
  - Map the incoming stdData to match the expected Audience interface (e.g., mapping a.bio to whyPerfect, a.imageUrl to image, and setting isDefault: true).
  - Merge these standard audiences into the finalAudiences list alongside the base 'Standard View' and any user-generated audiences fetched from /api/audiences.

### 4. Create Focus Group Datasets
- **Objective:** Create the JSON files that power the Focus Group datasets so they appear in the Admin data tables UI.
- **Actions:**
  - Create enhanced-app/public/data/configuration/focus_group_acquisition.json with an array of objects containing an offer key.
  - Create enhanced-app/public/data/configuration/focus_group_email.json with an array of objects containing a subject key.
  - Create enhanced-app/public/data/configuration/focus_group_products.json with an array of objects containing productName and description keys.
  - Create enhanced-app/public/data/configuration/focus_group_marketing.json with an array of objects containing a message key.

### 5. Update SyntheticTesting.tsx
- **Objective:** Refactor Synthetic Testing to load the new JSON datasets instead of relying on hardcoded const arrays.
- **Actions:**
  - Locate the hardcoded arrays (acquisitionOffers, EMAIL_HEADLINES, SIMULATION_PRODUCTS, marketingMessages).
  - Convert EMAIL_HEADLINES from a const to a state variable: const [emailHeadlines, setEmailHeadlines] = useState<string[]>([...]); and update references.
  - Convert the SIMULATION_PRODUCTS imported from data/simulationData.ts to use a local state variable: const [simulationProducts, setSimulationProducts] = useState<string[]>(SIMULATION_PRODUCTS);.
  - Ensure acquisitionOffers and marketingMessages are also correctly typed as state arrays.
  - Add a useEffect hook (or append to the existing initialization block) that fetches the four new JSON files.
  - On successful fetch, map the JSON objects back to string arrays and update the respective state variables (setAcquisitionOffers, setEmailHeadlines, setSimulationProducts, setMarketingMessages).

## Verification & Testing
1. Launch enhanced-app locally (npm run dev:all).
2. Navigate to Admin -> Data Tables. Confirm the new focus_group_*.json files appear and can be edited.
3. Open **Audience Generator**. Verify the data table reflects the data from microsite_sample_data.json and generating personas uses this data.
4. Open **ESpots**. Verify the member data table dynamically loads the same microsite_sample_data.json data and that generation works.
5. Open **Content Studio** -> **PDP Personalization**. Verify the "Customize Your Experience" audience selector includes the personas defined in standard_audiences.json.
6. Open **Focus Group**. Verify that the Acquisition, Email, Purchase, and Brief Simulation tabs successfully load and display the datasets from your newly created JSON files.
7. Run unit tests in enhanced-app (npm run test or npx vitest run) to ensure no regressions.