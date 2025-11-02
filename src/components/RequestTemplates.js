import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ShoppingCart as GroceryIcon,
  LocalHospital as MedicalIcon,
  Pets as PetIcon,
  Elderly as ElderlyIcon,
  Computer as TechIcon,
  DirectionsCar as TransportIcon,
  Home as HomeIcon,
  ChildCare as ChildcareIcon,
  Close as CloseIcon,
  AutoAwesome as TemplateIcon
} from '@mui/icons-material';

const REQUEST_TEMPLATES = [
  {
    id: 'grocery-shopping',
    name: 'Grocery Shopping',
    icon: <GroceryIcon />,
    color: '#4CAF50',
    category: 'Groceries & Shopping',
    urgency: 'medium',
    description: 'Help with grocery shopping',
    template: {
      title: 'Grocery Shopping Assistance',
      description: `I need help with grocery shopping. Here's what I need:

Items needed:
- [List your items here]

Preferred store: [Store name]
Budget: $[Amount]
Special requirements: [Dietary restrictions, brand preferences, etc.]

I can provide:
- Shopping list
- Payment method
- Delivery address`,
      location: '',
      estimatedTime: '1-2 hours'
    }
  },
  {
    id: 'medical-transport',
    name: 'Medical Appointment Transport',
    icon: <MedicalIcon />,
    color: '#F44336',
    category: 'Medical Assistance',
    urgency: 'high',
    description: 'Transportation to medical appointment',
    template: {
      title: 'Medical Appointment Transportation',
      description: `I need transportation to a medical appointment.

Appointment Details:
- Date: [Date]
- Time: [Time]
- Location: [Medical facility address]
- Duration: [Estimated appointment length]

Pick-up location: [Your address]
Special needs: [Wheelchair accessible, etc.]

Return trip needed: [Yes/No]`,
      location: '',
      estimatedTime: '2-3 hours'
    }
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    icon: <PetIcon />,
    color: '#FF9800',
    category: 'Pet Care',
    urgency: 'medium',
    description: 'Dog walking or pet sitting',
    template: {
      title: 'Pet Care Assistance',
      description: `I need help with pet care.

Pet details:
- Type: [Dog/Cat/Other]
- Name: [Pet name]
- Age: [Age]
- Temperament: [Friendly/Shy/etc.]

Service needed:
- [ ] Dog walking
- [ ] Pet sitting
- [ ] Feeding
- [ ] Medication administration

Duration: [How long]
Schedule: [When needed]
Special instructions: [Any special care needed]`,
      location: '',
      estimatedTime: '30 minutes - 1 hour'
    }
  },
  {
    id: 'elderly-checkup',
    name: 'Elderly Check-in',
    icon: <ElderlyIcon />,
    color: '#9C27B0',
    category: 'Companionship',
    urgency: 'low',
    description: 'Wellness check and companionship',
    template: {
      title: 'Elderly Wellness Check-in',
      description: `I need someone to check in on an elderly family member/friend.

Person details:
- Name: [Name]
- Age: [Age]
- Address: [Address]

Check-in needs:
- [ ] Wellness check
- [ ] Companionship/conversation
- [ ] Meal preparation
- [ ] Medication reminder
- [ ] Light housework

Frequency: [Daily/Weekly/etc.]
Duration: [How long per visit]
Special notes: [Health conditions, preferences, etc.]`,
      location: '',
      estimatedTime: '30 minutes - 1 hour'
    }
  },
  {
    id: 'tech-support',
    name: 'Tech Support',
    icon: <TechIcon />,
    color: '#2196F3',
    category: 'Technology Help',
    urgency: 'low',
    description: 'Help with technology issues',
    template: {
      title: 'Technology Assistance',
      description: `I need help with technology.

Issue:
- Device: [Computer/Phone/Tablet/etc.]
- Problem: [Describe the issue]

What I need help with:
- [ ] Setup/Installation
- [ ] Troubleshooting
- [ ] Learning how to use
- [ ] Software installation
- [ ] Internet/WiFi issues

Preferred method:
- [ ] In-person
- [ ] Remote assistance
- [ ] Phone guidance`,
      location: '',
      estimatedTime: '30 minutes - 1 hour'
    }
  },
  {
    id: 'transportation',
    name: 'General Transportation',
    icon: <TransportIcon />,
    color: '#00BCD4',
    category: 'Transportation',
    urgency: 'medium',
    description: 'Transportation assistance',
    template: {
      title: 'Transportation Assistance',
      description: `I need transportation help.

Trip details:
- Pick-up: [Address]
- Drop-off: [Address]
- Date: [Date]
- Time: [Time]

Purpose: [Reason for trip]
Passengers: [Number of people]
Special requirements: [Luggage, wheelchair, etc.]

Return trip: [Yes/No]
Estimated duration: [Time]`,
      location: '',
      estimatedTime: '1-2 hours'
    }
  },
  {
    id: 'home-maintenance',
    name: 'Home Maintenance',
    icon: <HomeIcon />,
    color: '#795548',
    category: 'Housework & Cleaning',
    urgency: 'low',
    description: 'Light home repairs or maintenance',
    template: {
      title: 'Home Maintenance Help',
      description: `I need help with home maintenance.

Task needed:
- [ ] Light bulb replacement
- [ ] Furniture assembly
- [ ] Hanging pictures/shelves
- [ ] Basic repairs
- [ ] Yard work
- [ ] Other: [Specify]

Details: [Describe what needs to be done]

Tools/materials:
- [ ] I have everything needed
- [ ] Need to purchase: [List items]

Urgency: [When needed]`,
      location: '',
      estimatedTime: '1-2 hours'
    }
  },
  {
    id: 'childcare',
    name: 'Childcare',
    icon: <ChildcareIcon />,
    color: '#E91E63',
    category: 'Childcare',
    urgency: 'high',
    description: 'Babysitting or childcare',
    template: {
      title: 'Childcare Assistance',
      description: `I need childcare help.

Children:
- Number: [How many]
- Ages: [Ages of children]

Care needed:
- Date: [Date]
- Time: [Start - End time]
- Location: [Your address]

Activities:
- [ ] Supervision
- [ ] Meal preparation
- [ ] Homework help
- [ ] Playtime
- [ ] Bedtime routine

Special notes: [Allergies, preferences, emergency contacts]`,
      location: '',
      estimatedTime: '2-4 hours'
    }
  }
];

export default function RequestTemplates({ open, onClose, onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handleUseTemplate = () => {
    if (selectedTemplate && onSelectTemplate) {
      onSelectTemplate(selectedTemplate.template);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TemplateIcon color="primary" />
            <Typography variant="h5" fontWeight="700">
              Request Templates
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Choose a template to quickly create a request with pre-filled information
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {REQUEST_TEMPLATES.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card
                elevation={selectedTemplate?.id === template.id ? 8 : 2}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: selectedTemplate?.id === template.id ? 2 : 0,
                  borderColor: 'primary.main',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 2,
                      bgcolor: template.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      color: 'white'
                    }}
                  >
                    {React.cloneElement(template.icon, { sx: { fontSize: 32 } })}
                  </Box>
                  
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {template.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {template.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={template.category}
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={template.urgency}
                      size="small"
                      color={
                        template.urgency === 'high' ? 'error' :
                        template.urgency === 'medium' ? 'warning' : 'default'
                      }
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </CardContent>
                
                {selectedTemplate?.id === template.id && (
                  <CardActions sx={{ bgcolor: 'primary.light', justifyContent: 'center' }}>
                    <Typography variant="caption" fontWeight="600" color="primary.dark">
                      ✓ Selected
                    </Typography>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedTemplate && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Template Preview:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {selectedTemplate.template.description}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUseTemplate}
          disabled={!selectedTemplate}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 3
          }}
        >
          Use This Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Export templates for use elsewhere
export { REQUEST_TEMPLATES };
