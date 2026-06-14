INSERT INTO rehaab_db.parents (patient_id,parent_name,relationship,contact_number,parent_email,created_at)
SELECT patient_id,
       JSON_UNQUOTE(JSON_EXTRACT(data,'$.parent_name')) AS parent_name,
       JSON_UNQUOTE(JSON_EXTRACT(data,'$.relationship')) AS relationship,
       JSON_UNQUOTE(JSON_EXTRACT(data,'$.contact_number')) AS contact_number,
       JSON_UNQUOTE(JSON_EXTRACT(data,'$.parent_email')) AS parent_email,
       created_at
FROM rehaab_db.consents
WHERE JSON_EXTRACT(data,'$.parent_name') IS NOT NULL OR JSON_EXTRACT(data,'$.parent_email') IS NOT NULL;
