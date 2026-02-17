# Werd
A dedicated app for reading the Holy Quran and tracking your Werd with minimal UI and simple features that does not distract the reader and encourages maintaining your reading streak.

## Features
* Creating a detailed plan for werd
* Tracking progress and managing streaks
* Multiple reading modes and custom fonts
* Dual Language Support
* Werd to PDF exporter

## Tech Stack
* React-Native (Expo)
* Node.js
* Typescript
* Tailwind CSS
* SQLite

## Database Schema

```mermaid
erDiagram
    %% Quranic Structure Relationships
    VERSES ||--o{ SURAHS : "first/last ayah"
    VERSES ||--o{ JUZ : "first/last ayah"
    VERSES ||--o{ PAGES : "first/last ayah"
    
    %% User Activity Relationships
    VERSES ||--o{ BOOKMARKS : "is bookmarked"
    VERSES ||--o{ WERD_SEGMENTS : "defines range"
    VERSES ||--o{ DAILY_PROGRESS : "start/end range"

    VERSES {
        int id PK
        int relative_id
        int surah_id
        text text
        int page
    }

    SURAHS {
        int id PK
        int first_verse FK
        int last_verse FK
        int starting_page_id
        text arabicName
        text englishName
        text type
    }

    JUZ {
        int id PK
        int first_verse FK
        int last_verse FK
    }

    PAGES {
        int id PK
        int first_verse FK
        int last_verse FK
    }

    USER_SETTINGS {
        int id PK
        text font
        int font_size
        int reading_mode
        string partition_type
        text starting_date
        text ending_date
        int theme
        text language
        int currentWerd
        int werd_plan_days
    }

    WERD_SEGMENTS {
        int id PK
        int first_verse FK
        int last_verse FK
        text date
        int done
    }

    BOOKMARKS {
        int id PK
        int verse_id FK
    }

    STREAKS {
        int id PK
        int count
        int longest
        text date
    }

    DATES {
        int day
        int month
        int year
        int is_done
    }

    DAILY_PROGRESS {
        int day_number PK
        text date
        int start_verse FK
        int end_verse FK
        int start_unit_val
        int end_unit_val
        int is_completed
    }
```

## Credits
* [Al Quran Cloud API](https://alquran.cloud/api): for providing full quran text and metadata
