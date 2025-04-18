import {
  Bath,
  Bed,
  Building2,
  Calendar,
  Heart,
  Home,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Square,
  Trash2,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { PropertyImage } from "../components/ui/property-image";
import axios from "axios";
import { format } from "date-fns";

import { PriceHistoryEntry } from "@/types/property";

interface Property {
  id: number;
  title: string;
  block: string;
  description: string;
  town: string;
  city: string;
  price: string;
  street_name: string;
  location: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  amenities: string;
  images?: string[];
  status: string;
  created_at: string;
  updated_at: string;
  owner: number;
  latitude: string;
  longitude: string;
  zip_code: string;
}

interface User {
  id: number;
  username: string;
}

interface PropertyDetailsPageState {
  currentUser: User | null;
  isFavorite: boolean;
}

export function PropertyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    block: "",
    street_name: "",
    town: "",
    city: "",
    property_type: "",
    bedrooms: 0,
    bathrooms: 0,
    square_feet: 0,
    amenities: "",
    images: [],
    status: "",
    latitude: "",
    longitude: "",
    zip_code: "",
  });

  const token = localStorage.getItem("authToken");

  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);

  const fetchData = async () => {
    try {

      setLoading(true);
      const propertyResponse = await axios.get(
        `http://localhost:8000/property/details/${id}`
      );
      const data = propertyResponse.data;

      setProperty(data);
      setFormData({
        title: data.title,
        description: data.description,
        price: data.price,
        block: data.block,
        street_name: data.street_name,
        town: data.town,
        city: data.city,
        property_type: data.property_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_feet: data.square_feet,
        amenities: data.amenities,
        images: data.images,
        status: data.status,
        latitude: data.latitude,
        longitude: data.longitude,
        zip_code: data.zip_code,
      });
      setImages(
        (data.images || []).map((img: string) =>
          img.startsWith("http")
            ? img
            : `http://localhost:8000/media/property_images/${img}`
        )
      );
      setAmenities(
        typeof data.amenities === "string"
          ? data.amenities.split(",").map((a: string) => a.trim())
          : data.amenities || []
      );
      
      if (token) {
        try {
          const [userRequest, propertyRequest, favoritesRequest] =
            await Promise.all([
              axios.get("http://localhost:8000/property/api/auth/verify/", {
                headers: { Authorization: `Token ${token}` },
              }),
              axios.get(`http://localhost:8000/property/details/${id}`),
              axios.get("http://localhost:8000/account/favorite/", {
                headers: { Authorization: `Token ${token}` },
              }),
            ]);
          setCurrentUser(userRequest.data);
          const isFav = favoritesRequest.data.some(
            (fav: any) => fav.id.toString() === id
          );
          setIsFavorite(isFav);
        } catch (error) {
          console.warn("User not authenticated or token invalid");
          setIsFavorite(false);
        }
      } else {
        setIsFavorite(false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async () => {
    try {
      // Prepare the payload based on property info or from user input.
      // Here we assume fixed values; you might derive these from property data.
      console.log(property);
      const payload = {
        town: property?.town.toUpperCase() || "TAMPINES",
        flat_type: property
          ? `${property.bedrooms + property.bathrooms}-ROOM`.toUpperCase()
          : "3-ROOM",
      };

      console.log([payload]);
      console.log(token);
      const response = await axios.post(
        "http://127.0.0.1:8000/advanced-features/predict-rent-12-months/",
        payload,
        { headers: { Authorization: `Token ${token}` } }
      );

      // Response expected: { predicted_rent: [number, ...] }
      const preds: number[] = response.data.predicted_rent;
      // Create an array of objects with month labels. Here, we use month numbers.
      // Alternatively, you can create a mapping for month names.
      const today = new Date();
      let currentYear = today.getFullYear();
      let currentMonth = today.getMonth() + 1; // Months 1-12

      const newHistory: PriceHistoryEntry[] = preds.map((price, index) => {
        // increment month based on index
        let month = currentMonth + index;
        let year = currentYear;
        if (month > 12) {
          month = month % 12;
          year += 1;
        }
        // Format month name (optional)
        const date = new Date(year, month - 1, 1);
        const monthLabel = format(date, "MMM yyyy"); // e.g., "Jun 2025"
        return { month: monthLabel, price };
      });
      setPriceHistory(newHistory);
    } catch (error) {
      console.error("Error fetching price history:", error);
    }
  };

  const isOwner = currentUser && property && property.owner === currentUser.id;

  useEffect(() => {
    fetchData();
  }, [id, token]);

  useEffect(() => {
    if (property) {
      fetchPriceHistory();
    }
  }, [property]);
  if (!property) {
    return <div>Property not found</div>;
  }

  const handleEditToggle = () => setIsEditing((prev) => !prev);

  const handleAddToFavorites = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.post(
        "http://localhost:8000/account/favorite/add/",
        { property_id: id },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setIsFavorite(true);
    } catch (error) {
      console.error("Error adding to favorites:", error);
      throw error;
    }
  };

  const handleRemoveFromFavorites = async () => {
    if (!token) return;

    try {
      await axios.post(
        "http://localhost:8000/account/favorite/remove/",
        { property_id: id },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setIsFavorite(false);
    } catch (error) {
      console.error("Error removing from favorites:", error);
      throw error;
    }
  };

  const handleFavoriteToggle = async () => {
    if (isFavorite === null) return;
    try {
      if (isFavorite) {
        await handleRemoveFromFavorites();
      } else {
        await handleAddToFavorites();
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Optionally show error to user
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;
    if (!token) throw new Error("No auth token found");
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(
        `http://localhost:8000/property/details/${property.id}/delete/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      alert("Listing deleted successfully!");
      navigate("/my-listings");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete the listing. Please try again.");
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication token not found');
      const currentUserResponse = await axios.get(
        "http://localhost:8000/property/api/auth/verify/",
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setCurrentUser(currentUserResponse.data);
      console.log("Current user:", currentUserResponse.data);
      const currentUser = currentUserResponse.data;
      console.log("Current user:", currentUser);
      console.log("Current user ID:", currentUser.id);
      const updateRequestData = {
        user_id: currentUser.id,
        property: property?.id,
        title: formData.title,
        description: formData.description,
        price: formData.price,
        block: formData.block,
        street_name: formData.street_name,
        town: formData.town,
        city: formData.city,
        property_type: formData.property_type,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        square_feet: formData.square_feet,
        amenities: formData.amenities,
        status: formData.status,
        latitude: formData.latitude,
        longitude: formData.longitude,
        zip_code: formData.zip_code,
        request_type: 'update',
        existing_images: images.filter(img => img.startsWith('http')),
      };
      
      console.log("Sending update request with data:", updateRequestData);

      const response = await axios.post(
        'http://localhost:8000/property/updating-request/',
        updateRequestData,
        {
          headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
          },
        }
      );

      console.log("Sending update request with data:", updateRequestData);
      // if (images.length > 0) {
      //   const formDataImages = new FormData();
      //   images.forEach((file) => {
      //       formDataImages.append('images', file);
      //   });

      //   console.log("FormData for images:", formDataImages);

      //   const imageResponse = await axios.post(
      //       `http://localhost:8000/property/updating-request/${response.data.id}/images/`,
      //       formDataImages,
      //       {
      //           headers: {
      //               'Authorization': `Token ${token}`,
      //           },
      //       }
      //   );
      //   console.log("Image upload response:", imageResponse.data);
      // }
      alert('Your edits have been submitted for admin approval');
      setIsEditing(false);
      fetchData();
      // window.location.reload();
    } catch (err) {
      console.error("Detailed error:", err);
      if (axios.isAxiosError(err)) {
        console.error("Response data:", err.response?.data);
        alert(`Error: ${err.response?.data?.message || err.message}`);
      } else {
        alert("Error updating listing. Please check required fields.");
      }
    }
  };

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border bg-white p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            {error === "Property not found"
              ? "Property Not Found"
              : "Error Loading Property"}
          </h1>
          <p className="mb-6 text-gray-600">
            {error === "Property not found"
              ? "Sorry, we couldn't find the property you're looking for."
              : "Failed to load property details. Please try again later."}
          </p>
          <Button onClick={() => navigate("/properties")}>
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-8 overflow-hidden rounded-lg">
            {images.length > 0 ? (
              <>
                <PropertyImage
                  src={images[selectedImage]}
                  alt={property.title}
                  aspectRatio="16/9"
                  className="h-[400px]"
                />
                <div className="mt-4 flex gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`overflow-hidden rounded-lg ${
                        selectedImage === index ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      <PropertyImage
                        src={image}
                        alt={`View ${index + 1}`}
                        aspectRatio="square"
                        className="h-20 w-20"
                      />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[400px] items-center justify-center bg-gray-100">
                <p>No images available</p>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              {/* <h1 className="text-3xl font-bold">{property.title}</h1> */}
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="text-3xl font-bold w-full border p-2 rounded"
                />
              ) : (
                <h1 className="text-3xl font-bold">{property.title}</h1>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleFavoriteToggle}
                  disabled={isFavorite === null}
                  className={isFavorite ? "text-red-500" : ""}
                >
                  <Heart
                    className="mr-2 h-5 w-5"
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite === null ? "Loading..." : isFavorite ? "Saved" : "Save"}
                </Button>
                <Button variant="outline">
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>
            </div>

            <div className="mb-6 flex items-center text-gray-500">
              <MapPin className="mr-2 h-5 w-5" />
              {property.location ||
                `${property.block} ${property.street_name}, ${property.town}, ${property.city}`}
              {/* <div className="mb-6 flex items-center text-gray-500">
                <MapPin className="mr-2 h-5 w-5" />
                {property.location || `${property.block} ${property.street_name}, ${property.town}, ${property.city}`}
              </div> */}
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-gray-400" />
                <span>{property.property_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-gray-400" />
                <span>{property.bedrooms} Bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-gray-400" />
                <span>{property.bathrooms} Bathrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Square className="h-5 w-5 text-gray-400" />
                <span>{property.square_feet} sqft</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">Description</h2>
              {/* <p className="text-gray-600">{property.description}</p> */}
              {isEditing ? (
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="text-gray-600 w-full border p-2 rounded"
                />
              ) : (
                <p className="text-gray-600">{property.description}</p>
              )}
            </div>

            {amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-2xl font-semibold">Amenities</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isEditing && (
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-6 text-center">
              <p className="text-3xl font-bold text-blue-600">
                ${property.price}
              </p>
              <p className="text-gray-500">per month</p>
              <br />
              {isOwner && isEditing && (
                <div className="mb-6 space-y-4">
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Listing
                  </Button>
                </div>
              )}
            </div>

            {isOwner && !isEditing && (
              <div className="mb-6 space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Listing
                </Button>
              </div>
            )}

            <div className="mb-6 space-y-4">
              <Button className="w-full">
                <Phone className="mr-2 h-5 w-5" />
                Call Agent
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowContactForm(!showContactForm)}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Message Agent
              </Button>
            </div>

            {showContactForm && (
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
                <textarea
                  placeholder="Your Message"
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                ></textarea>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            )}

            <div className="mt-6 flex items-center justify-between border-t pt-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                {property.status === "available"
                  ? "Available Now"
                  : property.status}
              </div>
              <div>Property ID: {property.id}</div>
            </div>

            {/* Market Price Trend Chart */}
            <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Market Price Trend (Next 12 Months)
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="h-80">
                  {priceHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>Loading price trend...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PropertyDetailsPage;
