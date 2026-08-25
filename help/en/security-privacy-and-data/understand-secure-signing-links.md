---
title: "Understand secure signing links"
description: "Learn how signing links provide contract access and when those links stop working."
category: "security-privacy-and-data"
slug: "understand-secure-signing-links"
order: 5
keywords:
  - "secure signing link"
  - "signing deadline"
  - "expired signing link"
  - "revoke signing link"
lastUpdated: "2026-08-25"
relatedArticles:
  - "understand-contract-history-and-signing-evidence"
  - "protect-your-scriboflow-account"
---

# Understand secure signing links

Scriboflow gives each active signer a separate link to review and sign a contract. A signer does not need a Scriboflow account to use the link.

## Keep signing links private

Anyone with access to an active signing link may be able to open the contract. Recipients should therefore treat the link like other confidential access information and avoid forwarding it.

The sender selects a signing deadline before sending the contract. The default deadline is 30 days, but it can be changed before sending.

## When a link stops working

A signing link can no longer be used to sign when:

- Its signing deadline has passed
- The request has been replaced by a fresh signing link
- The sender voids the contract
- A signer rejects the contract and closes the signing flow
- The request has already been completed or revoked

Resending creates a fresh link for the active recipient and closes the previous active request.

Standard link-based signatures record the signer's actions and evidence. Where available and selected, identity-based signing such as MitID adds verification through the supported identity provider.

If a recipient receives an invalid, expired or revoked link, the sender must issue a fresh signing request when the contract can still be sent.
