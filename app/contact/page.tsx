import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from "lucide-react";

const API_URL =
  "https://cdn.tcioe.edu.np/api/v1/public/department-mod/departments/department-of-electronics-and-computer-engineering";

type SocialLink = {
  label?: string;
  url?: string;
};

type Department = {
  name?: string;
  shortName?: string;
  phoneNo?: string;
  email?: string;
  thumbnail?: string;
  socialLinks?: SocialLink[];
};

export default async function ContactPage() {
  // Fetch department data on the server. Revalidate every 60s.
  const res = await fetch(API_URL, { next: { revalidate: 60 } });
  const data: Department | null = res.ok ? await res.json() : null;

  const deptName = data?.name ?? "Department";
  const phone = data?.phoneNo ?? "+977-1-1234567";
  const email = data?.email ?? "info@tcioe.edu.np";
  const thumbnail = data?.thumbnail;
  const socialLinks = data?.socialLinks ?? [];

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            Get in touch with us for inquiries about admissions, programs,
            research opportunities, or any other questions you may have.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 text-secondary mr-2" />
                  Visit Us
                </CardTitle>
                <CardDescription className="text-sm">
                  Thapathali Campus, Institute of Engineering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt={deptName}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : null}
                    <div>
                      <p className="font-medium">{deptName}</p>
                      <p className="text-sm text-muted-foreground">
                        {data?.shortName ?? "Tribhuvan University"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-secondary" />
                      <a href={`tel:${phone}`} className="hover:underline">
                        {phone}
                      </a>
                    </li>
                    <li className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-secondary" />
                      <a href={`mailto:${email}`} className="hover:underline">
                        {email}
                      </a>
                    </li>
                    <li className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span>Mon - Fri: 9:00 AM - 5:00 PM</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-secondary mr-2" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-sm">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Enter your first name"
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-sm">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Enter your last name"
                        required
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-sm">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-sm">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-sm">
                      Inquiry Category *
                    </Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admissions">Admissions</SelectItem>
                        <SelectItem value="programs">
                          Academic Programs
                        </SelectItem>
                        <SelectItem value="research">
                          Research Opportunities
                        </SelectItem>
                        <SelectItem value="faculty">
                          Faculty Information
                        </SelectItem>
                        <SelectItem value="facilities">
                          Facilities & Resources
                        </SelectItem>
                        <SelectItem value="general">
                          General Information
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="subject" className="text-sm">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      placeholder="Brief subject of your inquiry"
                      required
                      className="bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="message" className="text-sm">
                      Message *
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide details about your inquiry..."
                      className="min-h-[140px] bg-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <Button
                      type="submit"
                      className="bg-secondary hover:bg-secondary/90 flex items-center"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button type="reset" variant="outline">
                      Clear Form
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>* Required fields</p>
                    <p>
                      We typically respond within 24-48 hours during business
                      days.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <Card className="mt-16">
          <CardHeader>
            <CardTitle>Find Us on Campus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.752784108311!2d85.31625117617288!3d27.694034676190064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb19ae08c068d9%3A0x475bed1f66d060c!2sIOE%2C%20Thapathali%20Campus!5e0!3m2!1sen!2snp!4v1758869069030!5m2!1sen!2snp"
                  width="1200"
                  height="700"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
