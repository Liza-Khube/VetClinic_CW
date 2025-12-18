# Аналітичні SQL запити

---

## 1. Власники та їх улюбленці

---

#### **Бізнес-питання:**

Які власники з активними тваринами зареєстровані в системі, скільки у них улюбленців та хто саме?

---

#### **SQL-запит:**

```
WITH owner_pet_stats AS (
  SELECT 
    o.user_id,
    u.name || ' ' || u.surname AS owner_name,
    u.email,
    u.phone,
    COUNT(p.pet_id) AS pet_count
  FROM owner o
  JOIN "user" u ON o.user_id = u.user_id
  JOIN pet p ON o.user_id = p.owner_user_id
  WHERE p.is_deleted = FALSE AND u.is_deleted = FALSE
  GROUP BY o.user_id, u.name, u.surname, u.email, u.phone
  HAVING COUNT(p.pet_id) > ${minPetsAmount}
),
pet_details AS (
  SELECT 
    p.owner_user_id,
    STRING_AGG(p.name || ' (' || b.name || ' ' || s.name || ')', ', ' ORDER BY p.name) AS pet_with_breeds
  FROM pet p
  JOIN breed b ON p.breed_id = b.breed_id
  JOIN species s ON b.species_id = s.species_id
  WHERE p.is_deleted = FALSE
  GROUP BY p.owner_user_id
)
SELECT 
  ops.owner_name,
  ops.email,
  ops.phone,
  ops.pet_count,
  pd.pet_with_breeds
FROM owner_pet_stats ops
LEFT JOIN pet_details pd ON ops.user_id = pd.owner_user_id
ORDER BY ops.pet_count DESC;
```

---

#### **Пояснення:**

1. **Перший CTE `owner_pet_stats`:**

   - **JOIN таблиць** `owner`, `user`, `pet`;
   - **Фільтрація** лише активних тварини (`p.is_deleted = FALSE`) та активних користувачів (`u.is_deleted = FALSE`);
   - **Групування** за `user_id` та даними користувача (ім'я, прізвище, електронна пошта, телефон);
   - **Обчислення** кількості тварин на власника (`COUNT(p.pet_id)`);
   - **Фільтрація після групування** лише власників з кількістю тварин більше ніж **`${minPetsAmount}`:**
     - Умова `HAVING COUNT(p.pet_id) > ${minPetsAmount}` дозволяє вибрати власників, у яких загальна кількість тварин більша за задане у запиті в Query-параметрі значення;
2. **Другий CTE `pet_details`:**

   - **JOIN таблиць** `pet`, `breed`, `species`;
   - **Фільтрація** лише активних тварин (`p.is_deleted = FALSE`);
   - **Групування** за власником (`owner_user_id`);
   - **Формування** рядка з іменами тварин, їх породами та видами через `STRING_AGG`;
3. **Фінальний SELECT:**

   - **Об'єднання:** LEFT JOIN між `owner_pet_stats` та `pet_details` за `user_id`;
   - **Сортування:** за кількістю тварин у спадному порядку (`DESC`);

---

#### **Приклад виводу:**

Дані виведені для параметрів:

* minPetsAmount = 0

| owner_name        | email                      | phone         | pet_count | pet_with_breeds                                                             |
| ----------------- | -------------------------- | ------------- | --------- | --------------------------------------------------------------------------- |
| Maryna Shevchenko | maryna.s@gmail.com         | +380998887766 | 3         | Bonia (sphynx cat), Matylda (rainbox boa snake), Snizhynka (maine coon cat) |
| Pablo Honchar     | pablo.honchar999@gmail.com | +380962436758 | 2         | Lukash (scottish straight cat), Reks (shepherd dog)                        |
| Alex Pidbereznyi  | alex.pidbereznyi@gmail.com | +380971234627 | 2         | Draco (undpedigreed iguana), Drico (iguana iguana)                          |
| Vasyl Cherevko    | vasyl.ch@gmail.com         | +380982356878 | 1         | Ratatouille (unpedigreed rad)                                               |

---

## 2. Звіт про ефективність та завантаженість ветеринарів

---

#### **Бізнес-питання:**

- Які власники за певний місяць певного року мали більшу за певний мінімум кількість слотів, виділених під прийоми. Сортування за найбільшою кількість виділених годин.
- Хто з ветеринарів працює найефективніше і як саме вони витрачають свій робочий час?
- Чи не забагато ветеринарів, які мають розклад, але майже не приймають пацієнтів (тварин)?

---

#### **SQL-запит:**

```
WITH monthly_data AS (
  SELECT
    s.vet_user_id,
    u.name,
    u.surname,
    u.email,
    ARRAY_AGG(DISTINCT st.slot_duration ORDER BY st.slot_duration) AS slot_durations,
    COUNT(s.slot_id)::INT AS total_slots,
    COUNT(DISTINCT s.date)::INT AS working_days,
    ROUND(SUM(st.slot_duration) / 60.0, 2)::FLOAT AS total_hours
  FROM slot s
  INNER JOIN schedule_template st ON s.template_id = st.template_id
  INNER JOIN "user" u ON s.vet_user_id = u.user_id
  WHERE EXTRACT(MONTH FROM s.date) = ${month}
    AND EXTRACT(YEAR FROM s.date) = ${year}
    AND u.is_deleted = FALSE
  GROUP BY s.vet_user_id, u.name, u.surname, u.email
  HAVING COUNT(s.slot_id) > ${minSlotsCount}
)
SELECT
  md.name || ' ' || md.surname AS vet_name,
  md.email,
  v.specialisation,
  md.total_slots,
  md.working_days,
  md.slot_durations,
  md.total_hours,
  ROUND(md.total_slots::NUMERIC / md.working_days, 2)::FLOAT AS avg_slots_per_day
FROM monthly_data md
INNER JOIN vet v ON v.user_id = md.vet_user_id
ORDER BY md.total_hours DESC;
```

---

#### **Пояснення:**

1. **CTE `monthly_data`:**

- **INNER JOIN** таблиць `schedule_template` та `user`;
- **Фільтрація** лише існуючих (не видалених) ветеринарів (`u.is_deleted = FALSE`), враховуючи параметри, взяті з query (`month` і `year`) =>

  ```
  EXTRACT(MONTH FROM s.date) = ${month}
  AND EXTRACT(YEAR FROM s.date) = ${year}
  ```
- **Групування** за `s.vet_user_id` та даними користувача (ім'я `u.name`, прізвище `u.surname`, електронна пошта `u.email`, телефон);
- **Обчислення** цілого значення кількості виділених слотів на кожного ветеринара (`COUNT(s.slot_id)::INT AS total_slots`); цілого значення кількості днів, виділених на роботу ветеринару за вказаний місяць (`COUNT(s.slot_id)::INT AS total_slots`); округлена до 2 знаків після коми сума годин, виділених для кожного ветеринара;
- **Створення** масиву з хвилин, виділених на слоти для кожного ветеринара за вказаний місяць (`ARRAY_AGG(DISTINCT st.slot_duration ORDER BY st.slot_duration) AS slot_durations`);
- **Фільтрація після групування** лише ветеринарів з кількістю виділених слотів, більших ніж **`${minSlotsAmount}`:**

  - Умова `HAVING COUNT(s.slot_id) > ${minSlotsCount}` наголошує на виборі ветеринарів, у яких загальна кількість виділених слотів більша за задане у запиті в Query-параметрі значення - мінімально дозволена кількість слотів для ветеринара в цій клініці.

2. **Фінальний SELECT:**

- **INNER JOIN** таблиці `vet`;
- **Обчислення** середнього округленого до 2 знаків після коми значення кількості виділених слотів на робочий день на кожного ветеринара (`ROUND(md.total_slots::NUMERIC / md.working_days, 2)::FLOAT AS avg_slots_per_day`);
- **Сортування** за кількістю виділених годин на кожного ветеринара за спаданням.

##### **Приклад виводу:**

Дані виведені для параметрів:

* month = 12
* year = 2025
* minSlotsCount = 50

| vet_name         | email                  | specialisation | total_slots | working_days | slot_durations | total_hours | avg_slots_per_day |
| ---------------- | ---------------------- | :------------- | ----------: | -----------: | -------------: | ----------: | ----------------: |
| Olena Sydorenko  | sydorenko@gmail.com    | Dermatology    |         360 |           15 |           {20} |         120 |                24 |
| Vitaliy Zakharov | dr.vitaliy.z@gmail.com | Cardiology     |         110 |            8 |        {30,45} |        62.5 |             13.75 |
| Yuriy Smyrnov    | dr.yuriy.s@gmail.com   | Ophtalmology   |          82 |            7 |        {30,45} |        53.5 |             11.71 |
| Iryna Kravchenko | kravchenko@gmail.com   | Sonography     |          72 |            6 |           {40} |          48 |                12 |
