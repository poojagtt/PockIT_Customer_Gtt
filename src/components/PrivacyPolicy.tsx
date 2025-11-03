import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  StatusBar,
  Platform,
  
} from 'react-native';
import {useTheme} from '../modules';
import {Size, fontFamily} from '../modules';
import Icon from './Icon';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}>
        <SafeAreaProvider> 
             <SafeAreaView
              
               style={[styles.container, {backgroundColor: colors.background}]}>
       <View style={styles.header}>
          <View>
            <Text style={[styles.title, {color: colors.primary}]}>
              Privacy Policy
            </Text>
            <Text
              style={[
                {color: colors.text, fontSize: 12, fontFamily: fontFamily,marginBottom:4},
              ]}>
              POCKIT TECHNOLOGIES PRIVATE LIMITED{' '}
            </Text>
             <Text
              style={[
                {color: colors.text, fontSize: 10, fontFamily: fontFamily,maxWidth: '90%'},
              ]}>
             Regd. office at B 901 Kapil Abhijat, Dahanukar Colony Kothrud Pune 411038


            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={styles.closeButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Icon type="AntDesign" name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentContainer}>
            <Section
              title="Introduction"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'PockIT Technologies Private Limited', bold: true},
                  {text: ', a company incorporated under the Companies Act, 2013 operating under the brand name, '},
                  {text: 'PockIT Engineers', bold: true},
                  {text: ' ('},
                  {text: 'PockIT', bold: true},
                  {text: ', '},
                  {text: 'Company', bold: true},
                  {text: ', "we", "our", or "us") values the privacy of its customers and is committed to maintaining the highest standards of data protection and transparency. This '},
                  {text: 'Privacy Policy', bold: true},
                  {text: ' describes how the Company collects, uses, processes, discloses, and protects personal information of our clients, website visitors, service users, other stakeholders ("you" or "your") in India and the United Arab Emirates (UAE). This data privacy policy ('},
                  {text: 'Privacy Policy', bold: true},
                  {text: ') outlines how we collect, use, store, disclose, and protect your information in compliance with applicable data protection laws, including but not limited to:'}
                ]
              }, {
                type: 'numbered',
                items: [
                  'The Digital Personal Data Protection Act, 2023 ("DPDP Act") (India)',
                  'UAE Federal Decree Law No. 45 of 2021 on the Protection of Personal Data (UAE Data Protection Law); and',
                  'Any other applicable information security and privacy regulations.'
                ]
              }]} />

            <Section
              title="Scope"
              contentParts={[{
                type: 'paragraph',
                text: 'The Company is engaged in the business of providing IT solutions and services to its clients, including but not limited to managed services, hardware (new and refurbished) procurement, repair and maintenance, spares management, and deployment of refurbished IT equipment. This Policy applies to all personal information collected or processed by us who access or use our products and services, including but not limited to the comprehensive suite of IT support services, consultancy, and hardware sales, including through our websites or other digital platforms, support applications, support portals, and other means of interaction and other related offerings Repair and maintenance of IT hardware, network configuration, deployment, support, installation, configuration, and troubleshooting of software applications, IT consultancy and advisory services, marketing and sale of IT hardware products including computers, peripherals, and accessories (collectively, the Services) in India and the UAE.'
              }, {
                type: 'paragraph',
                text: 'By using our website or app, you consent to the terms of this Privacy Policy and our processing of your personal data.'
              }, {
                type: 'paragraph',
                text: 'By accessing, browsing, or otherwise using the Services, you expressly consent to the practices described in this Privacy Policy and agree to be bound by its terms.'
              }]} />

            <Section
              title="Information we collect"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'The '},
                  {text: 'Company', bold: true},
                  {text: ' may collect and process the following categories of personal and technical information:'}
                ]
              }, {
                type: 'numbered',
                textPartsList: [
                  [
                    {text: 'Personal identification information', bold: true},
                    {text: ': including but not limited to full name, postal address, telephone number, and email address.'}
                  ],
                  [
                    {text: 'Device & Technical Data', bold: true},
                    {text: ': When you use our website or mobile app, we may collect such as Internet Protocol (IP) address, browser type and version, operating system, device identifiers, and timestamps of access.'}
                  ],
                  [
                    {text: 'Business Data', bold: true},
                    {text: ': Information shared in connection with project execution, client onboarding, or contractual obligations.'}
                  ],
                  [
                    {text: 'App Usage & Log Data', bold: true},
                    {text: ': On the mobile app, we collect interactions with features, error logs, crash diagnostics, and performance metrics.'}
                  ],
                  [
                    {text: 'Support & Communication Data', bold: true},
                    {text: ': Data related to service tickets, queries, and support communications.'}
                  ],
                  [
                    {text: 'Cookies and Usage Data', bold: true},
                    {text: ': We may use cookies or similar technologies to improve functionality and user experience and user interactions with the '},
                    {text: 'Services', bold: true},
                    {text: ', navigation patterns, and engagement metrics.'}
                  ],
                  [
                    {text: 'Transactional & Billing Data', bold: true},
                    {text: ': including records of purchases, payment methods, billing information, and transaction history. Purchases made via the website or app, including payment method, billing details, and transaction history.'}
                  ]
                ]
              }]} />

            <Section
              title="Purpose and legal basis for processing"
              contentParts={[{
                type: 'paragraph',
                text: 'The Company processes personal data for the following purposes, on the lawful basis of contract performance, legitimate interest, consent, and/or compliance with legal obligations:'
              }, {
                type: 'numbered',
                items: [
                  'Legal basis for processing: The Company process information based on legal requirements, consent, performance of a contract, compliance with legal obligations and legitimate interests such as security, service improvement, and business operations through our website and app.',
                  'Provision of Services: To facilitate, manage, and fulfill service requests and commercial transactions through our website and app.',
                  'Service improvement: To evaluate usage trends and enhance the quality and functionality of our Services through our website and app.',
                  'Communications: To send updates, service notifications, marketing communications, or respond to customer enquiries through our website and app.',
                  'Compliance and legal obligations: To fulfill obligations under applicable laws, regulations, or pursuant to lawful requests from government authorities through our website and app.'
                ]
              }]} />

            <Section
              title="Disclosure of information"
              contentParts={[{
                type: 'paragraph',
                text: 'Personal data may be disclosed to third parties in the following circumstances:'
              }, {
                type: 'numbered',
                items: [
                  'Service providers and subcontractors/vendors: Who are bound by confidentiality and data protection obligations, who assist us in delivering our Services, including payment processors, IT system administrators, and analytics providers, subject to contractual confidentiality obligations through our website and app.',
                  'Legal compliance: Where disclosure is required under law, regulation, legal process, or court order, or where it is necessary to enforce our legal rights through our website and app.',
                  'Corporate Transactions/Third Parties: In connection with business restructuring (e.g., mergers, acquisitions), restructuring, or the sale or transfer of Company assets, where user data may be part of the transferred assets through our website and app.',
                  'Internal personnel and affiliated group entities: (if required for service delivery) through our website and app.',
                  'If personal data is transferred outside India or the UAE: We ensure such transfers comply with applicable laws and appropriate safeguards (e.g., standard contractual clauses or equivalent protections).'
                ]
              }]} />

            <Section
              title="Data Security"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'The '},
                  {text: 'Company', bold: true},
                  {text: ' employs industry-standard technical and organizational measures to safeguard personal data on both website and mobile app such as SSL encryption, role-based access, and data masking. against unauthorized access, alteration, disclosure, or destruction to protect your personal data on both the website and mobile app, such as SSL encryption, role-based access, and data masking. However, we disclaim liability for breaches beyond our control (e.g., cyberattacks). Notwithstanding such measures, the Company disclaims liability for any data breach that occurs due to circumstances beyond its reasonable control, including but not limited to cyberattacks and acts of God.'}
                ]
              }, {
                type: 'numbered',
                textPartsList: [
                  [
                    {text: 'Right of Access', bold: true},
                    {text: '- to request access to the personal data we hold about you through the app or website.'}
                  ],
                  [
                    {text: 'Right to Rectification', bold: true},
                    {text: '- to request correction of inaccurate or incomplete data.'}
                  ],
                  [
                    {text: 'Right to Erasure', bold: true},
                    {text: '- to request deletion of personal data under specified conditions.'}
                  ],
                  [
                    {text: 'Right to Restrict Processing', bold: true},
                    {text: '- to limit processing of your personal data in certain scenarios.'}
                  ],
                  [
                    {text: 'Right to Object', bold: true},
                    {text: '- to processing based on legitimate interests or for direct marketing messages sent via browser push or app notifications.'}
                  ],
                  [
                    {text: 'Right to Data Portability', bold: true},
                    {text: '- to receive personal data in a structured, commonly used format or have it transferred to another entity.'}
                  ],
                  [
                    {text: 'Lodge a complaint with a data protection authority', bold: true},
                    {text: '- If such an event occur in India, these rights are governed by the Information Technology Act, 2000 and applicable rules. In the UAE, you may be protected under Federal Decree-Law No. 45 of 2021.'}
                  ],
                  [
                    {text: 'Requests to exercise these rights', bold: true},
                    {text: ' may be submitted via email to itsupport@pockitengineers.com The Company reserves the right to verify your identity before processing such requests.'}
                  ]
                ]
              }]} />

            <Section
              title="Data Retention:"
              contentParts={[{
                type: 'paragraph',
                text: 'We retain personal data only for as long as necessary for the purposes stated above, or as required by applicable law or contractual obligations.'
              }, {
                type: 'numbered',
                textPartsList: [
                  [
                    {text: 'App user profiles', bold: true},
                    {text: ', logs, and preferences are retained until account deletion or inactivity for a defined period.'}
                  ],
                  [
                    {text: 'Website analytics', bold: true},
                    {text: ' and cookies are retained per browser settings or cookie policy.'}
                  ]
                ]
              }]} />

            <Section
              title="Cookies and tracking technologies"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'Our website/ mobile app use '},
                  {text: 'cookies and similar technologies', bold: true},
                  {text: ' to enhance user experience, analyze traffic, and support certain features. Users may configure browser settings to manage or disable cookies. However, doing so may affect the availability or functionality of certain '},
                  {text: 'Services', bold: true},
                  {text: '.'}
                ]
              }]} />

            <Section
              title="On our mobile app"
              contentParts={[{
                type: 'paragraph',
                text: 'We may use tools for crash reporting, user behaviour, and engagement metrics.'
              }, {
                type: 'paragraph',
                text: "You may disable cookies in browser settings or revoke app tracking permissions in your device's privacy settings."
              }]} />

            <Section
              title="Third-Party Websites"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'Our website and mobile app may include hyperlinks to websites operated by third parties. The '},
                  {text: 'Company', bold: true},
                  {text: ' assumes no responsibility or liability for the privacy practices, data collection, or content of such '},
                  {text: 'third-party websites', bold: true},
                  {text: '.'}
                ]
              }]} />

            <Section
              title="Changes to this Policy"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'This '},
                  {text: 'Privacy Policy', bold: true},
                  {text: ' will be posted on the website and/or sent via in-app notification.is subject to revision from time to time. Any material changes shall be notified by updating the '},
                  {text: 'Last Updated', bold: true},
                  {text: ' date and publishing the revised version on our website or mobile app. Continued use of the website and mobile app following such revisions shall constitute your acceptance of the updated policy.'}
                ]
              }]} />

          

            <Section
              title="Privacy consent (for Website/App compliance)"
              contentParts={[{
                type: 'paragraph',
                text: 'We use cookies and collect certain data to enhance your experience and provide tailored services.'
              }, {
                type: 'paragraph',
                textParts: [
                  {text: 'By using our website or mobile app, you consent to our use of cookies and agree to our '},
                  {text: 'Privacy Policy', bold: true}
                ]
              }]} />



<Section
              title="Downloadable legal format (PDF version)"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'We can generate a PDF version of the Privacy Policy for integration or download from the footer of your app/website. We can also prepare:'},
                ]
              }, {
                type: 'numbered',
                items: [
                  'HTML version for your website’s Privacy Policy pages',
                  `Markdown version if you're using a CMS or app framework that supports it.`]
              
                
              }]} />

                <Section
              title="Contact Information"
              contentParts={[{
                type: 'paragraph',
                textParts: [
                  {text: 'For any queries, concerns, or requests relating to this '},
                  {text: 'Privacy Policy', bold: true},
                  {text: ' or your personal data, you may contact us at:'}
                ]
              }, {
                type: 'bulleted',
                textPartsList: [
                  [
                    {text: 'Email', bold: true},
                    {text: ': itsupport@pockitengineers.com'}
                  ],
                  [
                    {text: 'Address', bold: true},
                    {text: ': PockIT Engineers, Pune, Maharashtra, India'}
                  ]
                ]
              }]} />

            <View style={styles.footer}>
              <Text style={[styles.footerText, {color: colors.text}]}>
                <Text style={{fontWeight: '700', color: '#020202'}}>Last updated on : 01-06-2025</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
};

type TextPart = { text: string; bold?: boolean };
interface ContentPart {
  type: 'paragraph' | 'bulleted' | 'numbered';
  text?: string;
  textParts?: TextPart[];
  textPartsList?: TextPart[][];
  items?: string[];
}

interface SectionProps {
  title: string;
  contentParts: ContentPart[];
}

const Section: React.FC<SectionProps> = ({title, contentParts}) => {
  const colors = useTheme();

  const renderTextParts = (parts: TextPart[]) => (
    <Text style={[styles.sectionContent, {color: colors.text}]}> 
      {parts.map((part, idx) =>
        <Text key={idx} style={part.bold ? [styles.sectionContent, {fontWeight: '700', color: '#020202'}] : [styles.sectionContent, {color: colors.text}]}> 
          {part.text}
        </Text>
      )}
    </Text>
  );

  const renderBoldText = (text: string) => {
    const parts = text.split(':');
    if (parts.length > 1) {
      return (
        <Text style={[styles.sectionContent, {color: colors.text}]}> 
          <Text style={[styles.sectionContent, {fontWeight: '700', color: '#020202'}]}>
            {parts[0]}:
          </Text>
          {parts[1]}
        </Text>
      );
    }
    return (
      <Text style={[styles.sectionContent, {color: colors.text}]}>{text}</Text>
    );
  };

  const renderContent = () => {
    return contentParts.map((part, partIndex) => {
      if (part.type === 'paragraph') {
        if (part.textParts) {
          return (
            <Text key={partIndex} style={[styles.sectionContent, {color: colors.text, marginBottom: 6}]}> 
              {part.textParts.map((tp, idx) => (
                <Text key={idx} style={tp.bold ? [styles.sectionContent, {fontWeight: '700', color: '#020202'}] : [styles.sectionContent, {color: colors.text}]}> 
                  {tp.text}
                </Text>
              ))}
            </Text>
          );
        } else {
          return (
            <Text key={partIndex} style={[styles.sectionContent, {color: colors.text, marginBottom: 6}]}> 
              {part.text}
            </Text>
          );
        }
      } else if ((part.type === 'bulleted' || part.type === 'numbered') && part.textPartsList) {
        return (
          <View key={partIndex}>
            {part.textPartsList.map((parts, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletText}>•</Text>
                </View>
                {renderTextParts(parts)}
              </View>
            ))}
          </View>
        );
      } else if (part.type === 'bulleted' || part.type === 'numbered') {
        return (
          <View key={partIndex}>
            {part.items?.map((item, index) => (
              <View key={index} style={styles.bulletItem}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletText}>•</Text>
                </View>
                {renderBoldText(
                  item.startsWith('• ')
                    ? item.substring(2).trim()
                    : item.trim(),
                )}
              </View>
            ))}
          </View>
        );
      }
      return null;
    });
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: colors.text}]}>{title}</Text>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop:16,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    paddingBottom: 6,
    height: Platform.OS === 'android' ? 120 : 100,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  title: {
    fontSize: Size.xl,
    fontWeight: '700',
    fontFamily: fontFamily,
   marginBottom:5
  },
  closeButton: {
    padding: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    paddingTop: 15,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: fontFamily,
    color: '#1C1C28',
  },
  sectionContent: {
    fontSize: 12,
    lineHeight: 22,
    fontFamily: fontFamily,
    color: '#525252',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    marginRight: 8,
    paddingTop: 2,
  },
  bulletText: {
    color: '#525252',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontFamily,
  },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: fontFamily,
    lineHeight: 20,
    marginBottom: 10,
    color: '#525252',
  },
});

export default PrivacyPolicy;
