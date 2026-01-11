"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BillProgressBar } from "@/components/bill-progress-bar";
import { PaymentAmountSelector } from "@/components/payment-amount-selector";
import {
  Plus,
  Minus,
  ShoppingCart,
  Users,
  MapPin,
  Clock,
  ChefHat,
  Leaf,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number | null;
  allergens: string[] | null;
}

interface MenuCategory {
  category: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  items: MenuItem[];
}

interface CheckoutData {
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
  table: {
    id: string;
    tableNumber: string;
    capacity: number;
    section: string | null;
  };
  qrCode: {
    id: string;
    code: string;
    scanCount: number;
  };
  menu: MenuCategory[];
  paymentProcessor: "stripe" | "mercadopago" | "toast" | null;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CheckoutInterfaceProps {
  qrCode: string;
}

export function CheckoutInterface({ qrCode }: CheckoutInterfaceProps) {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState<{
    totalAmount: number;
    totalClaimed: number;
    totalPaid: number;
    availableAmount: number;
    percentPaid: number;
    claims: Array<{
      id: string;
      claimedAmount: string;
      splitFeePortion: string;
      totalToPay: string;
      status: string;
      expiresAt: Date;
      paidAt: Date | null;
    }>;
    isFullyPaid: boolean;
  } | null>(null);
  const [showAmountSelector, setShowAmountSelector] = useState(false);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  const [tableOrders, setTableOrders] = useState<
    Array<{
      id: string;
      orderNumber: string;
      items: Array<{
        name: string;
        quantity: number;
        price: string;
      }>;
      totalAmount: string;
      status: string;
      createdAt: Date;
    }>
  >([]);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current.get(categoryId);
    if (element) {
      const headerOffset = 140; // Account for sticky header + tabs
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      setActiveCategory(categoryId);
    }
  };

  const fetchCheckoutData = useCallback(async () => {
    try {
      const response = await fetch(`/api/checkout/${qrCode}`);
      const data = await response.json();

      if (data.success) {
        setCheckoutData(data);
      } else {
        setError(data.error || "Failed to load menu");
      }
    } catch (error) {
      console.log(error);
      setError("Unable to connect to the restaurant system");
    } finally {
      setLoading(false);
    }
  }, [qrCode]);

  const fetchPaymentProgress = useCallback(
    async (orderId: string) => {
      try {
        const response = await fetch(
          `/api/checkout/${qrCode}/create-claim?orderId=${orderId}`
        );
        const data = await response.json();
        setPaymentProgress(data);
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    },
    [qrCode]
  );

  useEffect(() => {
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  useEffect(() => {
    if (existingOrderId) {
      fetchPaymentProgress(existingOrderId);
    }
  }, [existingOrderId, fetchPaymentProgress]);

  const fetchTableOrders = useCallback(async () => {
    if (!checkoutData?.table.id) return;

    try {
      const response = await fetch(`/api/checkout/${qrCode}/table-orders`);
      if (response.ok) {
        const data = await response.json();
        setTableOrders(data.orders || []);

        // Check if this table has any active orders
        if (data.orders && data.orders.length > 0) {
          const activeOrder = data.orders.find(
            (o: { status: string; id: string }) =>
              o.status === "ordering" ||
              o.status === "payment_started" ||
              o.status === "partially_paid"
          );

          if (activeOrder) {
            setExistingOrderId(activeOrder.id);
            setOrderSubmitted(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching table orders:", error);
    }
  }, [qrCode, checkoutData?.table.id]);

  useEffect(() => {
    if (checkoutData) {
      fetchTableOrders();
    }
  }, [checkoutData, fetchTableOrders]);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.menuItem.id === menuItem.id
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { menuItem, quantity: 1 }];
      }
    });

    toast.success(`${menuItem.name} agregado al pedido`);
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.menuItem.id === menuItemId
      );

      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter((item) => item.menuItem.id !== menuItemId);
      }
    });
  };

  const getCartTotal = () => {
    return cart
      .reduce((total, item) => {
        return total + parseFloat(item.menuItem.price) * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getPaymentProcessorName = (type: string) => {
    switch (type) {
      case "mercadopago":
        return "MercadoPago";
      case "stripe":
        return "Stripe";
      case "toast":
        return "Toast POS";
      default:
        return type;
    }
  };

  const isPaymentAvailable = checkoutData?.paymentProcessor !== null;

  // Helper function to manage session tokens
  const getSessionToken = (): string => {
    const key = "payment_session_token";
    let token = localStorage.getItem(key);

    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(key, token);
    }

    return token;
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    setProcessingPayment(true);

    try {
      // Check if table already has an active order
      const checkResponse = await fetch(`/api/checkout/${qrCode}/active-order`);
      let orderId = null;

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        orderId = data.order.id;
      }

      // Create order with items
      const orderItems = cart.map((item) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: parseFloat(item.menuItem.price),
      }));

      const createResponse = await fetch(
        `/api/checkout/${qrCode}/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderId, // Pass existing order ID if available
            items: orderItems,
            total: parseFloat(getCartTotal()),
          }),
        }
      );

      const data = await createResponse.json();

      if (data.success) {
        setExistingOrderId(data.order.id);
        setOrderSubmitted(true);
        setCart([]); // Clear cart after submission
        setIsCartOpen(false);
        toast.success("¡Pedido enviado exitosamente!");

        // Refresh table orders and payment progress
        await fetchTableOrders();
        await fetchPaymentProgress(data.order.id);
      } else {
        toast.error(data.message || "Error al enviar el pedido");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Ocurrió un error. Por favor intenta de nuevo.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleAmountSelected = async (amount: number) => {
    try {
      setProcessingPayment(true);

      // Step 1: Create payment claim
      const claimResponse = await fetch(
        `/api/checkout/${qrCode}/create-claim`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: existingOrderId,
            claimedAmount: amount,
            sessionToken: getSessionToken(),
          }),
        }
      );

      const claimData = await claimResponse.json();

      if (!claimData.success) {
        toast.error(claimData.message || "Error al reservar el monto");
        setProcessingPayment(false);
        return;
      }

      // Step 2: Create payment with claim ID
      const paymentResponse = await fetch(
        `/api/checkout/${qrCode}/create-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimId: claimData.claim.id,
          }),
        }
      );

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.paymentUrl) {
        // Redirect to MercadoPago
        window.location.href = paymentData.paymentUrl;
      } else {
        toast.error("Error al crear el pago");
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Ocurrió un error");
      setProcessingPayment(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!existingOrderId) {
      toast.error("Por favor envía tu pedido primero");
      return;
    }

    // Show amount selector
    setShowAmountSelector(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ChefHat className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <ChefHat className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-xl font-bold mb-2">No se pudo cargar el menú</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchCheckoutData}>Intentar de nuevo</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!checkoutData) {
    return null;
  }

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {checkoutData.restaurant.name}
                </h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Mesa {checkoutData.table.tableNumber}
                  </span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>Hasta {checkoutData.table.capacity} personas</span>
                  {checkoutData.table.section && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {checkoutData.table.section}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button className="relative" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Pedido
                    {getCartItemCount() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {getCartItemCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="flex flex-col h-[85vh] rounded-t-2xl px-5 py-6 sm:h-full sm:max-w-md sm:rounded-t-none sm:rounded-l-xl sm:inset-y-0 sm:right-0 sm:inset-x-auto sm:border-l sm:border-t-0 sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right"
                >
                  {/* Drag handle for mobile */}
                  <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-4 sm:hidden" />

                  <SheetHeader className="pb-4 border-b px-1">
                    <SheetTitle className="flex items-center gap-2 text-lg">
                      <ShoppingCart className="h-5 w-5" />
                      Tu Pedido
                    </SheetTitle>
                    <SheetDescription>
                      Mesa {checkoutData.table.tableNumber} •{" "}
                      {checkoutData.restaurant.name}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto py-4 px-1">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <ShoppingCart className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="font-medium">Tu carrito está vacío</p>
                        <p className="text-sm mt-1">
                          Agrega productos del menú para comenzar
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.menuItem.id}
                            className="flex gap-3 p-3 bg-muted/50 rounded-xl"
                          >
                            {item.menuItem.imageUrl && (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                                <Image
                                  src={item.menuItem.imageUrl}
                                  alt={item.menuItem.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm leading-tight">
                                {item.menuItem.name}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                ${parseFloat(item.menuItem.price).toFixed(2)}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => removeFromCart(item.menuItem.id)}
                                  aria-label={item.quantity === 1 ? "Eliminar del carrito" : "Reducir cantidad"}
                                >
                                  {item.quantity === 1 ? (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <Minus className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <span className="w-8 text-center text-sm font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => addToCart(item.menuItem)}
                                  aria-label="Agregar uno más"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-semibold text-sm">
                                ${(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <div className="border-t pt-5 space-y-4 px-1">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${getCartTotal()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>${getCartTotal()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Button
                          className="w-full h-14 text-base font-semibold rounded-xl"
                          disabled={!isPaymentAvailable || processingPayment}
                          onClick={handleSubmitOrder}
                        >
                          {processingPayment ? (
                            <>Enviando...</>
                          ) : isPaymentAvailable ? (
                            <>Enviar Pedido a Cocina</>
                          ) : (
                            <>Pago No Disponible</>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          {!isPaymentAvailable
                            ? "Por favor, habla con un mesero para completar tu pedido"
                            : "Tu pedido será enviado a la cocina para su preparación"
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        {checkoutData.menu.length > 1 && (
          <div className="border-b bg-white/95 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-1 px-4 py-2">
                  {checkoutData.menu.map((category, index) => {
                    const categoryId = category.category?.id || `uncategorized-${index}`;
                    const isActive = activeCategory === categoryId ||
                      (activeCategory === null && index === 0);
                    return (
                      <button
                        key={categoryId}
                        onClick={() => scrollToCategory(categoryId)}
                        className={`
                          px-4 py-2 rounded-full text-sm font-medium transition-all
                          ${isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }
                        `}
                      >
                        {category.category?.name || "Menu Items"}
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="invisible" />
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {paymentProgress && (
        <div className="border-b bg-white">
          <div className="max-w-6xl mx-auto p-4">
            <BillProgressBar
              totalAmount={paymentProgress.totalAmount}
              totalClaimed={paymentProgress.totalClaimed}
              totalPaid={paymentProgress.totalPaid}
              availableAmount={paymentProgress.availableAmount}
              percentPaid={paymentProgress.percentPaid}
              claims={paymentProgress.claims}
              isFullyPaid={paymentProgress.isFullyPaid}
            />
          </div>
        </div>
      )}

      {/* Table Orders */}
      {tableOrders.length > 0 && (
        <div className="border-b bg-gray-50">
          <div className="max-w-6xl mx-auto p-4">
            {/* <h2 className="text-lg font-semibold mb-4">Table Orders</h2> */}

            {/* Proceed to Payment Button */}
            {orderSubmitted && existingOrderId && (
              <div className="space-y-2">
                <Button
                  className="w-full h-14 text-base font-semibold rounded-xl"
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={processingPayment}
                >
                  Continuar al Pago
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Selecciona cuánto deseas pagar de la cuenta
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Unavailable Warning */}
      {!isPaymentAvailable && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-6xl mx-auto p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 text-sm">
                  Sistema de Pago No Disponible
                </h3>
                <p className="text-sm text-yellow-800 mt-1">
                  El restaurante aún no ha configurado un procesador de pagos.
                  Puedes ver el menú, pero el pago en línea no está disponible
                  actualmente. Por favor habla con un mesero para completar tu
                  pedido.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="max-w-6xl mx-auto p-4">
        {checkoutData.menu.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Menú próximamente</p>
                <p className="text-sm">
                  Estamos trabajando en agregar deliciosos platillos a nuestro menú
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {checkoutData.menu.map((category, categoryIndex) => {
              const categoryId = category.category?.id || `uncategorized-${categoryIndex}`;
              return (
              <div
                key={categoryId}
                ref={(el) => {
                  if (el) categoryRefs.current.set(categoryId, el);
                }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {category.category?.name || "Menu Items"}
                  </h2>
                  {category.category?.description && (
                    <p className="text-muted-foreground mt-1">
                      {category.category.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((item) => (
                    <Card key={item.id} className={`overflow-hidden hover:shadow-md transition-shadow ${!item.isAvailable ? 'opacity-60' : ''}`}>
                      {/* Image Section */}
                      {item.imageUrl ? (
                        <div className="relative aspect-[4/3] bg-gray-100">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Badge variant="secondary">No Disponible</Badge>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                          <ChefHat className="h-12 w-12 text-gray-300" />
                        </div>
                      )}

                      {/* Content Section */}
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold leading-tight">{item.name}</h3>
                              {item.allergens && item.allergens.length > 0 && (
                                <Leaf className="h-4 w-4 text-green-600 shrink-0" />
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-lg shrink-0">
                            ${parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          {item.preparationTime ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.preparationTime} min
                            </span>
                          ) : (
                            <span />
                          )}
                          <Button
                            onClick={() => addToCart(item)}
                            disabled={!item.isAvailable}
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8">
          <div className="max-w-md mx-auto space-y-2">
            <Button
              className="w-full h-14 shadow-lg rounded-full text-base font-medium"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              <span>Ver Pedido ({getCartItemCount()})</span>
              <span className="ml-auto font-bold">${getCartTotal()}</span>
            </Button>
            {!isPaymentAvailable && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-full px-4 py-2 text-xs text-center text-yellow-900 shadow">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Pago no disponible - habla con un mesero
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amount Selector Modal */}
      {showAmountSelector && paymentProgress && (
        <Sheet open={showAmountSelector} onOpenChange={setShowAmountSelector}>
          <SheetContent
            side="bottom"
            className="h-[90vh] overflow-y-auto rounded-t-2xl px-5 py-6"
          >
            {/* Drag handle for mobile */}
            <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
            <SheetHeader className="px-1">
              <SheetTitle className="text-lg">Elige el Monto a Pagar</SheetTitle>
              <SheetDescription>
                Selecciona cuánto deseas pagar de la cuenta total
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 px-1">
              <PaymentAmountSelector
                totalAmount={paymentProgress.totalAmount}
                availableAmount={paymentProgress.availableAmount}
                totalClaimed={paymentProgress.totalClaimed}
                onAmountSelected={handleAmountSelected}
                onCancel={() => setShowAmountSelector(false)}
                isLoading={processingPayment}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Footer - Powered by Payment Processor */}
      {checkoutData?.paymentProcessor && (
        <div className="pb-6 pt-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center text-xs text-muted-foreground">
              Powered by{" "}
              {getPaymentProcessorName(checkoutData.paymentProcessor)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
