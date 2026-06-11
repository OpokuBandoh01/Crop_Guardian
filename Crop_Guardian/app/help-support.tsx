import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'How do I scan a crop for diseases?',
      answer: 'Go to the Scan tab or click "Scan crop" in Quick Actions. Align the leaf inside the frame and press the capture button. The AI will analyze the leaf image and provide a diagnosis with recommended actions.',
      category: 'Scanning',
    },
    {
      question: 'Can I use CropGuardian offline?',
      answer: 'Yes! Navigate to Profile > Offline Database and download the crop model databases (e.g., Maize & Grains). Once downloaded, the AI model works completely offline without cellular network.',
      category: 'Database',
    },
    {
      question: 'What crops are supported by CropGuardian?',
      answer: 'Currently we support Maize, Cassava, Tomato, Pepper, Plantain, and Cocoa. We are continually training new models to support more crops in future updates.',
      category: 'Crops',
    },
    {
      question: 'How do I configure weather alerts?',
      answer: 'Go to Profile > Notification Settings. You can enable or disable daily weather notifications and urgent alerts for heavy rainfall or extreme temperature conditions.',
      category: 'Weather',
    },
    {
      question: 'How does the voice guidance work?',
      answer: 'On the scan result screen, click the "Listen" button. The app will read out the disease details and treatment actions in local languages (such as Twi) or English to make the advice accessible.',
      category: 'Voice',
    },
  ];

  const handleContact = (type: 'email' | 'call' | 'whatsapp') => {
    let url = '';
    if (type === 'email') {
      url = 'mailto:support@cropguardian.org?subject=CropGuardian Support Request';
    } else if (type === 'call') {
      url = 'tel:+233241234567';
    } else if (type === 'whatsapp') {
      url = 'https://wa.me/233241234567?text=Hello%20CropGuardian%20Support';
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Don't know how to open URI: " + url);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      
      {/* ================= HEADER SECTION ================= */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={[styles.backButton, { borderColor: theme.primary }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={moderateScale(18)} color={theme.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.primary }]}>Help & Support</Text>

        <View style={styles.rightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= HERO INTRO SECTION ================= */}
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colorScheme === 'light' ? '#EBF7E9' : '#1E2C20' }]}>
            <Ionicons name="help-buoy-outline" size={moderateScale(32)} color="#094A04" />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>How can we help you?</Text>
          <Text style={[styles.heroSub, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
            Find answers to frequently asked questions or contact our agricultural extension officers directly.
          </Text>
        </View>

        {/* ================= SEARCH BAR ================= */}
        <View style={[styles.searchContainer, { borderColor: theme.inputBorder, backgroundColor: theme.surface }]}>
          <Ionicons name="search-outline" size={moderateScale(18)} color={theme.icon} style={styles.searchIcon} />
          <TextInput
            placeholder="Search FAQs..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={moderateScale(16)} color={theme.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* ================= FAQ ACCORDION SECTION ================= */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>FREQUENTLY ASKED QUESTIONS</Text>
        
        <View style={styles.faqList}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <View 
                  key={index} 
                  style={[styles.faqCard, { backgroundColor: theme.surface }]}
                >
                  <TouchableOpacity
                    style={styles.faqHeader}
                    onPress={() => toggleExpand(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={moderateScale(16)} 
                      color={theme.primary} 
                    />
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={[styles.faqAnswer, { color: colorScheme === 'light' ? '#4B5563' : '#D1D5DB' }]}>
                        {faq.answer}
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: colorScheme === 'light' ? '#EBF7E9' : '#2E3D30' }]}>
                        <Text style={[styles.categoryText, { color: theme.primary }]}>{faq.category}</Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
              <Ionicons name="search-outline" size={moderateScale(32)} color={theme.placeholder} />
              <Text style={[styles.emptyText, { color: theme.placeholder }]}>No FAQs match your search.</Text>
            </View>
          )}
        </View>

        {/* ================= CONTACT CHANNELS ================= */}
        <Text style={[styles.sectionTitle, { color: theme.primary, marginTop: verticalScale(24) }]}>
          STILL NEED HELP? CONTACT US
        </Text>
        
        <View style={[styles.contactCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.contactTitle, { color: theme.text }]}>Agricultural Support Network</Text>
          <Text style={[styles.contactSub, { color: colorScheme === 'light' ? '#687076' : '#9BA1A6' }]}>
            Our team is available Monday - Friday, 8:00 AM - 5:00 PM for custom diagnostics and help.
          </Text>

          <View style={styles.contactButtonsRow}>
            {/* Call button */}
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: '#094A04' }]} 
              onPress={() => handleContact('call')}
              activeOpacity={0.8}
            >
              <Ionicons name="call-sharp" size={moderateScale(16)} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Call Us</Text>
            </TouchableOpacity>

            {/* WhatsApp button */}
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: '#25D366' }]} 
              onPress={() => handleContact('whatsapp')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={moderateScale(16)} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            {/* Email button */}
            <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: theme.primary === '#094A04' ? '#3B82F6' : '#60A5FA' }]} 
              onPress={() => handleContact('email')}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-sharp" size={moderateScale(16)} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
  },
  backButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    textAlign: 'center',
  },
  rightSpacer: {
    width: moderateScale(32),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(40),
  },

  // Hero section
  heroSection: {
    alignItems: 'center',
    marginVertical: verticalScale(16),
    paddingHorizontal: scale(16),
  },
  iconCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  heroTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    marginBottom: verticalScale(4),
  },
  heroSub: {
    fontSize: moderateScale(11.5),
    textAlign: 'center',
    lineHeight: verticalScale(16),
  },

  // Search input
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(12),
    height: verticalScale(46),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },

  // Section title
  sectionTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: '#094A04',
    letterSpacing: 1.5,
    marginBottom: verticalScale(12),
  },

  // FAQ List & Cards
  faqList: {
    gap: verticalScale(10),
  },
  faqCard: {
    borderRadius: moderateScale(12),
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: scale(14),
    gap: scale(12),
  },
  faqQuestion: {
    fontSize: moderateScale(12.5),
    fontWeight: '700',
    flex: 1,
  },
  faqAnswerContainer: {
    paddingHorizontal: scale(14),
    paddingBottom: scale(14),
    borderTopWidth: 1,
    borderTopColor: 'rgba(9, 74, 4, 0.04)',
    paddingTop: scale(10),
  },
  faqAnswer: {
    fontSize: moderateScale(11.5),
    lineHeight: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
  },
  categoryText: {
    fontSize: moderateScale(9.5),
    fontWeight: '700',
  },

  // Empty FAQ state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(24),
    borderRadius: moderateScale(12),
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
  },
  emptyText: {
    fontSize: moderateScale(12),
    marginTop: verticalScale(8),
    fontWeight: '500',
  },

  // Contact card
  contactCard: {
    borderRadius: moderateScale(14),
    padding: scale(16),
    borderWidth: 1.2,
    borderColor: 'rgba(9, 74, 4, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  contactTitle: {
    fontSize: moderateScale(13.5),
    fontWeight: '800',
    marginBottom: verticalScale(4),
  },
  contactSub: {
    fontSize: moderateScale(11),
    lineHeight: verticalScale(15),
    marginBottom: verticalScale(16),
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    gap: scale(4),
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
});
