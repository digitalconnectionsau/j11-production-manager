import { Router } from 'express';
import { db } from '../db/index.js';
import { contacts, clients } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get all contacts for a specific client
router.get('/clients/:clientId/contacts', authenticateToken, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    const clientContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.clientId, clientId))
      .orderBy(contacts.isPrimary, contacts.firstName);

    res.json(clientContacts);
  } catch (error) {
    console.error('Error fetching client contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get all contacts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const allContacts = await db
      .select({
        id: contacts.id,
        clientId: contacts.clientId,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        position: contacts.position,
        email: contacts.email,
        phone: contacts.phone,
        office: contacts.office,
        isPrimary: contacts.isPrimary,
        clientName: clients.name,
        companyName: clients.company,
      })
      .from(contacts)
      .leftJoin(clients, eq(contacts.clientId, clients.id))
      .orderBy(contacts.firstName);

    res.json(allContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Create a new contact
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { clientId, firstName, lastName, position, email, phone, office, isPrimary } = req.body;

    // If this contact is being set as primary, unset other primary contacts for this client
    if (isPrimary) {
      await db
        .update(contacts)
        .set({ isPrimary: false })
        .where(eq(contacts.clientId, clientId));
    }

    const [newContact] = await db
      .insert(contacts)
      .values({
        clientId,
        firstName,
        lastName,
        position,
        email,
        phone,
        office,
        isPrimary: isPrimary || false,
      })
      .returning();

    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update a contact
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { clientId, firstName, lastName, position, email, phone, office, isPrimary } = req.body;

    // If this contact is being set as primary, unset other primary contacts for this client
    if (isPrimary) {
      await db
        .update(contacts)
        .set({ isPrimary: false })
        .where(and(eq(contacts.clientId, clientId), eq(contacts.id, contactId)));
    }

    const [updatedContact] = await db
      .update(contacts)
      .set({
        firstName,
        lastName,
        position,
        email,
        phone,
        office,
        isPrimary: isPrimary || false,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId))
      .returning();

    if (!updatedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete a contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = parseInt(req.params.id);

    const [deletedContact] = await db
      .delete(contacts)
      .where(eq(contacts.id, contactId))
      .returning();

    if (!deletedContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;