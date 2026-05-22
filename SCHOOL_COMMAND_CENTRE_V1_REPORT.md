# School Command Centre v1

## Purpose

Simplify the school area into the heart of the product: school identity, teachers/classes, parent join, and light settings.

## Applied changes

- School setup: parent invite route changed to /parent-join/{slug}; completion now opens /school
- School profile sheet: old /join route aligned to /parent-join/{slug}
- SchoolProfilePage replaced with School Command Centre v1

## Kept intentionally

- Existing school logo upload/save flow
- Existing school detail save flow
- Existing TeachersTab component
- Existing /school route

## Removed from main school experience

- Heavy profile/contact-first layout
- Reactions/stat-heavy thinking
- Old profile-page-first experience

## New structure

- Overview
- Teachers
- Parent Join
- Settings
