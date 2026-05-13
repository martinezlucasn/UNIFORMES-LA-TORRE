# Security Specification for Uniformes La Torre

## 1. Data Invariants
- A product must have a positive selling price and stock.
- A sale must have at least one item.
- The total of a sale must be subtotal + surcharge.
- Surcharge must be exactly 10% of subtotal if paymentMethod is 'card', else 0.
- `createdAt` and `updatedAt` field must be validated against `request.time`.

## 2. The Dirty Dozen Payloads (Targeting Rejection)

1. **Anonymous Write**: Attempting to create a product without authentication.
2. **Invalid Price**: Create product with `sellingPrice: -50`.
3. **Stock Poisoning**: Update product stock with a 1MB string.
4. **ID Injection**: Create product with ID `../../../etc/passwd`.
5. **Admin Spoofing**: User trying to update their own role in a user profile (though not explicitly implemented yet, good for future-proofing).
6. **Sale Math Cheat**: Sale with `subtotal: 100`, `surcharge: 0`, `total: 50`.
7. **Card Surcharge Bypass**: Sale with `paymentMethod: 'card'`, `subtotal: 100`, `surcharge: 0`.
8. **Impersonation**: Create a sale with `ownerId` of another user.
9. **History Deletion**: Attempting to delete a sale record (sales should be immutable).
10. **Shadow Product Fields**: Adding `isApproved: true` to a product during creation.
11. **Future Timestamp**: Setting `createdAt` to a date in 2030.
12. **Orphaned Sale Item**: Creating a sale with a product ID that doesn't exist in the `products` collection.

## 3. Test Runner (Draft Plan)
The `firestore.rules.test.ts` will verify that:
- Authenticated users can CRUD products but only with valid data.
- Authenticated users can Create sales, but NOT Update or Delete them.
- Public/Unauthenticated users are denied all access.
- Schema validation blocks all malicious payloads listed above.
