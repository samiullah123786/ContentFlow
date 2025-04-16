-- Sample finance data for testing the dashboard

-- Check if there's existing data in the finances table
DO $$
DECLARE
    finance_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO finance_count FROM finances;
    
    -- Only insert sample data if the table is empty
    IF finance_count = 0 THEN
        -- Get client IDs if available
        DECLARE
            client_id_1 UUID;
            client_id_2 UUID;
            client_id_3 UUID;
        BEGIN
            -- Try to get some client IDs
            SELECT id INTO client_id_1 FROM clients ORDER BY id LIMIT 1;
            SELECT id INTO client_id_2 FROM clients ORDER BY id OFFSET 1 LIMIT 1;
            SELECT id INTO client_id_3 FROM clients ORDER BY id OFFSET 2 LIMIT 1;
            
            -- Insert sample invoices
            INSERT INTO finances (client_id, amount, type, due_date, status, created_at)
            VALUES
                -- Invoices
                (client_id_1, 1250.00, 'invoice', CURRENT_DATE + INTERVAL '15 days', 'pending', NOW() - INTERVAL '5 days'),
                (client_id_1, 3500.00, 'invoice', CURRENT_DATE + INTERVAL '30 days', 'pending', NOW() - INTERVAL '3 days'),
                (client_id_2, 2750.00, 'invoice', CURRENT_DATE - INTERVAL '5 days', 'paid', NOW() - INTERVAL '20 days'),
                (client_id_3, 4200.00, 'invoice', CURRENT_DATE - INTERVAL '15 days', 'paid', NOW() - INTERVAL '30 days'),
                
                -- Payments
                (client_id_2, 2750.00, 'payment', NULL, 'completed', NOW() - INTERVAL '2 days'),
                (client_id_3, 4200.00, 'payment', NULL, 'completed', NOW() - INTERVAL '10 days'),
                
                -- Expenses
                (NULL, 450.00, 'expense', NULL, 'completed', NOW() - INTERVAL '7 days'),
                (NULL, 1200.00, 'expense', NULL, 'completed', NOW() - INTERVAL '14 days'),
                (NULL, 350.00, 'expense', NULL, 'pending', NOW() - INTERVAL '21 days'),
                (NULL, 175.00, 'expense', NULL, 'pending', NOW() - INTERVAL '2 days');
                
            RAISE NOTICE 'Sample finance data inserted successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error inserting sample data: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Finance data already exists, skipping sample data insertion';
    END IF;
END $$;
